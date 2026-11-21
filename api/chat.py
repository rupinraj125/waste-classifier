"""
POST /api/chat
Two modes determined by the "type" field in the body:

1. type="analyze" (default when messages is empty / not passed)
   body: { "label":"plastic", "bin":"recycle", "confidence":0.95,
           "lang":"en-IN", "image_desc":"" }
   Returns a structured JSON analysis:
   {
     "type": "analyze",
     "image_desc": "A crumpled plastic water bottle",
     "is_waste": true,
     "waste_verdict": "Yes, this is household waste that can be recycled.",
     "steps": ["Step 1: ...", "Step 2: ...", ...],
     "hazard_note": "..." or null,
     "quick_tip": "one sentence tip",
     "provider": "gemini"|"groq"
   }

2. type="chat"
   body: { "label":"plastic", "bin":"recycle", "confidence":0.95,
           "lang":"en-IN", "messages":[...] }
   Returns: { "type":"chat", "text":"...", "lang":"en-IN", "provider":"gemini"|"groq" }

Provider priority: Gemini (primary) -> Groq (secondary) -> built-in fallback
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

GEMINI_KEY   = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_URL   = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
)

GROQ_KEY   = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

LANGS = {
    "en-IN": "English", "hi-IN": "Hindi", "ta-IN": "Tamil",  "te-IN": "Telugu",
    "kn-IN": "Kannada", "ml-IN": "Malayalam", "mr-IN": "Marathi",
    "gu-IN": "Gujarati", "bn-IN": "Bengali",  "pa-IN": "Punjabi", "od-IN": "Odia",
}


# ── Prompts ────────────────────────────────────────────────────────────────

def analyze_prompt(label, bin_type, confidence, lang_name):
    return f"""You are a waste-disposal expert assistant for Indian households.
The user photographed an item. The vision model identified it as '{label}' (bin: '{bin_type}', confidence {confidence:.0%}).

Your job:
1. Write a 1-sentence plain-English description of what this item likely is (image_desc).
2. State whether this is household waste (is_waste: true/false).
3. Write a 1-sentence verdict on what category of waste it is (waste_verdict).
4. List exactly 4 numbered disposal/recycling steps, each one sentence, practical for India (steps array).
5. If hazardous, write a 1-sentence warning (hazard_note), else null.
6. Write one quick memorable tip under 12 words (quick_tip).

Reply ONLY as valid JSON in {lang_name} (all string values in {lang_name}), exactly this shape:
{{
  "image_desc": "...",
  "is_waste": true,
  "waste_verdict": "...",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
  "hazard_note": "..." or null,
  "quick_tip": "..."
}}
No extra text, no markdown fences, just the JSON object."""


def chat_system_prompt(label, bin_type, confidence, lang_name):
    return (
        f"You are a friendly waste-sorting assistant for Indian households. "
        f"Item: '{label}', bin: '{bin_type}', confidence {confidence:.0%}. "
        f"Answer questions about disposal, recycling, reuse, hazards, and local Indian practice. "
        f"Reply ONLY in {lang_name}. Keep replies to 2-3 sentences, warm and plain. "
        "No markdown, no bullets, no emojis."
    )


# ── Gemini call ────────────────────────────────────────────────────────────

def _gemini(system_text, user_messages, max_tokens=600, temperature=0.4):
    def _role(r):
        return "model" if r == "assistant" else r
    contents = [{"role": _role(m["role"]), "parts": [{"text": m["content"]}]} for m in user_messages]
    payload = json.dumps({
        "system_instruction": {"parts": [{"text": system_text}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
    }).encode()
    req = urllib.request.Request(
        GEMINI_URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as r:
        out = json.loads(r.read())
    return out["candidates"][0]["content"]["parts"][0]["text"].strip()


# ── Groq call ─────────────────────────────────────────────────────────────

def _groq(system_text, user_messages, max_tokens=600, temperature=0.4):
    convo = [{"role": "system", "content": system_text}] + user_messages
    payload = json.dumps({
        "model": GROQ_MODEL, "messages": convo,
        "max_tokens": max_tokens, "temperature": temperature,
    }).encode()
    req = urllib.request.Request(
        GROQ_URL, data=payload,
        headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as r:
        out = json.loads(r.read())
    return out["choices"][0]["message"]["content"].strip()


# ── Dispatcher ─────────────────────────────────────────────────────────────

def llm(system_text, user_messages, max_tokens=600, temperature=0.4):
    """Returns (text, provider_name) trying Gemini then Groq."""
    if GEMINI_KEY:
        try:
            return _gemini(system_text, user_messages, max_tokens, temperature), "gemini"
        except Exception:
            pass
    if GROQ_KEY:
        try:
            return _groq(system_text, user_messages, max_tokens, temperature), "groq"
        except Exception:
            pass
    raise RuntimeError("No LLM available.")


# ── Analyze mode ───────────────────────────────────────────────────────────

def do_analyze(label, bin_type, confidence, lang):
    lang_name = LANGS.get(lang, "English")
    sys_text  = analyze_prompt(label, bin_type, confidence, lang_name)
    user_msgs = [{"role": "user", "content": "Analyze this waste item now."}]
    raw, provider = llm(sys_text, user_msgs, max_tokens=700, temperature=0.3)

    # Strip any accidental markdown fences
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed = json.loads(raw)   # propagate parse error up so caller can handle
    parsed["type"]     = "analyze"
    parsed["provider"] = provider
    return parsed


# ── Chat mode ──────────────────────────────────────────────────────────────

def do_chat(label, bin_type, confidence, lang, messages):
    lang_name = LANGS.get(lang, "English")
    sys_text  = chat_system_prompt(label, bin_type, confidence, lang_name)
    history   = [m for m in messages if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": "Give me a quick summary for disposal."}]
    text, provider = llm(sys_text, history[-8:], max_tokens=300, temperature=0.5)
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
            if not GEMINI_KEY and not GROQ_KEY:
                return self._send(503, {"error": "No LLM API keys set.", "disabled": True})
            lang = d.get("lang", "en-IN")
            req_type = d.get("type", "analyze")

            if req_type == "chat":
                result = do_chat(label, d.get("bin", "general"),
                                 float(d.get("confidence", 0)),
                                 lang, d.get("messages", []))
            else:
                try:
                    result = do_analyze(label, d.get("bin", "general"),
                                        float(d.get("confidence", 0)), lang)
                except (json.JSONDecodeError, KeyError):
                    # JSON parse failed — fall back to chat-style summary
                    result = do_chat(label, d.get("bin", "general"),
                                     float(d.get("confidence", 0)), lang, [])
                    result["type"] = "analyze_fallback"

            self._send(200, result)
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"API error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"Chat failed: {e}"})

    def log_message(self, *_):
        pass
