"""
POST /api/chat
Two modes:

1. type="analyze"  (default on first call)
   body: { "label":"plastic", "bin":"recycle", "confidence":0.95, "lang":"en-IN" }
   Returns structured JSON analysis card:
   {
     "type": "analyze",
     "image_desc": "...",
     "is_waste": true,
     "waste_verdict": "...",
     "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
     "hazard_note": "..." | null,
     "quick_tip": "...",
     "provider": "groq" | "gemini"
   }

2. type="chat"
   body: { "label":"plastic", "bin":"recycle", "confidence":0.95,
           "lang":"en-IN", "messages":[...] }
   Returns: { "type":"chat", "text":"...", "lang":"en-IN", "provider":"..." }

Provider priority (based on live testing):
  1. Groq  qwen/qwen3.8-27b  — primary  (~0.5s, perfect JSON, stable)
  2. Gemini gemini-3.5-flash-lite — secondary  (slower, good quality)
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

# ── Groq (PRIMARY) ─────────────────────────────────────────────────────────
GROQ_KEY   = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

# ── Gemini (SECONDARY) ─────────────────────────────────────────────────────
GEMINI_KEY   = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
# URL built at request time (key embedded in query string)

LANGS = {
    "en-IN": "English", "hi-IN": "Hindi",   "ta-IN": "Tamil",   "te-IN": "Telugu",
    "kn-IN": "Kannada", "ml-IN": "Malayalam","mr-IN": "Marathi",
    "gu-IN": "Gujarati","bn-IN": "Bengali",  "pa-IN": "Punjabi", "od-IN": "Odia",
}

UA = "WasteSorterApp/2.0"   # prevents Cloudflare blocks


# ── Prompts ────────────────────────────────────────────────────────────────

def _analyze_sys(label, bin_type, confidence, lang_name):
    return (
        f"You are a waste-disposal expert assistant for Indian households.\n"
        f"The user photographed an item. Vision model: '{label}', bin: '{bin_type}', "
        f"confidence {confidence:.0%}. Language for all string values: {lang_name}.\n\n"
        f"Reply ONLY as a valid JSON object — no markdown, no code fences, no extra text:\n"
        '{"image_desc":"1-sentence description of what this item looks like",'
        '"is_waste":true,'
        '"waste_verdict":"1-sentence verdict on the waste category",'
        '"steps":["Step 1: ...","Step 2: ...","Step 3: ...","Step 4: ..."],'
        '"hazard_note":"1-sentence hazard warning if hazardous, otherwise use JSON null",'
        '"quick_tip":"memorable tip under 12 words"}'
    )

def _chat_sys(label, bin_type, confidence, lang_name):
    return (
        f"You are a friendly waste-sorting assistant for Indian households. "
        f"Item: '{label}', bin: '{bin_type}', confidence {confidence:.0%}. "
        f"Answer disposal questions helpfully. "
        f"Reply ONLY in {lang_name}. Keep replies to 2-3 sentences, plain, no markdown."
    )


# ── HTTP helper ────────────────────────────────────────────────────────────

def _post(url, body, headers):
    data = json.dumps(body, ensure_ascii=False).encode()
    req  = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json", "User-Agent": UA, **headers},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


# ── Groq call ──────────────────────────────────────────────────────────────

def _groq(sys_text, messages, max_tokens=800, temperature=0.3, json_mode=False):
    body = {
        "model": GROQ_MODEL,
        "messages": [{"role": "system", "content": sys_text}] + messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    out = _post(GROQ_URL, body, {"Authorization": f"Bearer {GROQ_KEY}"})
    return out["choices"][0]["message"]["content"].strip()


# ── Gemini call ────────────────────────────────────────────────────────────

def _gemini(sys_text, messages, max_tokens=800, temperature=0.3):
    def _role(r):
        return "model" if r == "assistant" else r
    contents = [{"role": _role(m["role"]), "parts": [{"text": m["content"]}]}
                for m in messages]
    body = {
        "system_instruction": {"parts": [{"text": sys_text}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
    }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
    )
    out  = _post(url, body, {})
    text = out["candidates"][0]["content"]["parts"][0]["text"].strip()
    # Strip any accidental markdown fences
    if text.startswith("```"):
        lines = text.split("\n")
        text  = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()
    return text


# ── Provider dispatcher ────────────────────────────────────────────────────

def _llm(sys_text, messages, max_tokens=800, temperature=0.3, json_mode=False):
    """Try Groq → Gemini. Returns (text, provider_name)."""
    errors = []

    if GROQ_KEY:
        try:
            return _groq(sys_text, messages, max_tokens, temperature, json_mode), "groq"
        except Exception as e:
            errors.append(f"groq: {e}")

    if GEMINI_KEY:
        try:
            return _gemini(sys_text, messages, max_tokens, temperature), "gemini"
        except Exception as e:
            errors.append(f"gemini: {e}")

    raise RuntimeError("; ".join(errors) or "No LLM API keys configured.")


# ── Analyze mode ───────────────────────────────────────────────────────────

def do_analyze(label, bin_type, confidence, lang):
    lang_name = LANGS.get(lang, "English")
    sys_text  = _analyze_sys(label, bin_type, confidence, lang_name)
    user_msgs = [{"role": "user", "content": "Analyze this waste item now."}]

    # Try with json_mode on (Groq supports it; Gemini ignores the flag gracefully)
    raw, provider = _llm(sys_text, user_msgs, max_tokens=800, temperature=0.3, json_mode=True)
    parsed = json.loads(raw)   # propagate JSONDecodeError to caller

    # Sanitise: ensure steps is exactly a list of 4
    steps = parsed.get("steps")
    if not isinstance(steps, list):
        steps = []
    parsed["steps"] = steps[:4]

    parsed["type"]     = "analyze"
    parsed["provider"] = provider
    return parsed


# ── Chat mode ──────────────────────────────────────────────────────────────

def do_chat(label, bin_type, confidence, lang, messages):
    lang_name = LANGS.get(lang, "English")
    sys_text  = _chat_sys(label, bin_type, confidence, lang_name)
    history   = [m for m in messages
                 if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": "Give me a quick summary for disposal."}]
    text, provider = _llm(sys_text, history[-8:], max_tokens=300, temperature=0.5)
    return {"type": "chat", "text": text, "lang": lang, "provider": provider}


# ── Handler ────────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            n = int(self.headers.get("content-length", 0))
            d = json.loads(self.rfile.read(n) or b"{}")
            label = d.get("label") or d.get("class")
            if not label:
                return self._send(400, {"error": "No label provided."})
            if not GROQ_KEY and not GEMINI_KEY:
                return self._send(503, {"error": "No LLM API keys set.", "disabled": True})

            lang     = d.get("lang", "en-IN")
            req_type = d.get("type", "analyze")

            if req_type == "chat":
                result = do_chat(
                    label, d.get("bin", "general"),
                    float(d.get("confidence", 0)),
                    lang, d.get("messages", []))
            else:
                try:
                    result = do_analyze(
                        label, d.get("bin", "general"),
                        float(d.get("confidence", 0)), lang)
                except (json.JSONDecodeError, KeyError):
                    # JSON parse failed — degrade gracefully to plain chat
                    result = do_chat(
                        label, d.get("bin", "general"),
                        float(d.get("confidence", 0)), lang, [])
                    result["type"] = "analyze_fallback"

            self._send(200, result)
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"API error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"Chat failed: {e}"})

    def log_message(self, *_):
        pass
