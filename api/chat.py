"""
POST /api/chat  — 100% Groq (qwen/qwen3.8-27b), Gemini as fallback only.

Mode 1 — type="analyze"
  body: { type, label, category, bin, confidence, lang, is_waste }
  Returns structured JSON — ALL strings in the chosen language:
  { type, image_desc, is_waste, waste_verdict, steps[4], hazard_note, quick_tip, provider }

Mode 2 — type="chat"
  body: { type, label, category, bin, confidence, lang, messages[] }
  Returns: { type, text, lang, provider }

LANGUAGE: every string in the response is written in the requested language
so Sarvam TTS reads it correctly.
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

GROQ_KEY   = os.environ.get("GROQ_API_KEY",   "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL",     "qwen/qwen3.8-27b")
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_KEY   = os.environ.get("GEMINI_API_KEY",   "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL",     "gemini-3.5-flash-lite")

UA = "WasteSorterApp/2.0"

LANGS = {
    "en-IN": "English",    "hi-IN": "Hindi",     "ta-IN": "Tamil",
    "te-IN": "Telugu",     "kn-IN": "Kannada",   "ml-IN": "Malayalam",
    "mr-IN": "Marathi",    "gu-IN": "Gujarati",  "bn-IN": "Bengali",
    "pa-IN": "Punjabi",    "od-IN": "Odia",
}


def _sys_analyze(label, category, bin_type, conf, lang_name, is_waste):
    extra = "" if is_waste else " This item may not be typical waste — still give practical guidance on what to do with it."
    return (
        f"You are a helpful, friendly neighbour who knows everything about waste sorting in India.{extra}\n"
        f"The user just photographed their '{label}' (category: '{category}', bin: '{bin_type}', confidence: {conf:.0%}).\n\n"
        f"Write everything in {lang_name} from the user's perspective — like you're talking directly to them.\n"
        f"Be conversational, warm, and practical. NOT textbook. NOT robotic.\n"
        f"Use 'you', 'your', 'just', 'make sure', 'don't worry' — everyday language.\n"
        f"Each step should feel like a helpful tip from a friend, not an instruction manual.\n\n"
        "Reply ONLY as a valid JSON object — no markdown, no code fences:\n"
        '{"image_desc":"One natural sentence about what this specific item looks like to you",'
        '"is_waste":true,'
        '"waste_verdict":"One sentence telling them exactly which bin to use and why it matters",'
        '"steps":["step 1 — friendly, specific, actionable","step 2","step 3","step 4"],'
        '"hazard_note":"One sentence warning them about a real risk with this item — or JSON null if safe",'
        '"quick_tip":"A memorable, practical tip under 12 words that makes their life easier"}\n\n'
        f"RULES:\n"
        f"- All 4 steps must be specific to '{label}' — not copy-paste generic advice.\n"
        f"- Steps should address what most people get WRONG with this item.\n"
        f"- quick_tip should be something they will actually remember and use.\n"
        f"- Write everything in {lang_name}."
    )


def _sys_chat(label, category, bin_type, conf, lang_name):
    return (
        f"You are a friendly, knowledgeable neighbour helping someone sort their waste in India.\n"
        f"They have a '{label}' (category: '{category}', bin: '{bin_type}', confidence: {conf:.0%}).\n"
        f"Answer their question in a warm, direct, conversational way — like texting a helpful friend.\n"
        f"Use everyday language. If they're doing something wrong, gently correct them.\n"
        f"CRITICAL: Reply ONLY in {lang_name}. Keep it to 2–3 sentences. No bullet points, no markdown."
    )


def _post(url, body_dict, extra_hdrs):
    data = json.dumps(body_dict, ensure_ascii=False).encode()
    req  = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json", "User-Agent": UA, **extra_hdrs},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def _groq(sys_text, messages, max_tokens=900, temp=0.3, json_mode=False):
    body = {
        "model":       GROQ_MODEL,
        "messages":    [{"role": "system", "content": sys_text}] + messages,
        "max_tokens":  max_tokens,
        "temperature": temp,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    out = _post(GROQ_URL, body, {"Authorization": f"Bearer {GROQ_KEY}"})
    return out["choices"][0]["message"]["content"].strip()


def _gemini(sys_text, messages, max_tokens=900, temp=0.3):
    def _r(r): return "model" if r == "assistant" else r
    contents = [{"role": _r(m["role"]), "parts": [{"text": m["content"]}]} for m in messages]
    body = {
        "system_instruction": {"parts": [{"text": sys_text}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temp},
    }
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}")
    out  = _post(url, body, {})
    text = out["candidates"][0]["content"]["parts"][0]["text"].strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text  = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()
    return text


def _llm(sys_text, messages, max_tokens=900, temp=0.3, json_mode=False):
    if GROQ_KEY:
        try:
            return _groq(sys_text, messages, max_tokens, temp, json_mode), "groq"
        except Exception:
            pass
    if GEMINI_KEY:
        try:
            return _gemini(sys_text, messages, max_tokens, temp), "gemini"
        except Exception:
            pass
    raise RuntimeError("No LLM available.")


def do_analyze(label, category, bin_type, conf, lang, is_waste):
    lang_name = LANGS.get(lang, "English")
    sys_text  = _sys_analyze(label, category, bin_type, conf, lang_name, is_waste)
    msgs      = [{"role": "user", "content": f"Analyze the '{label}' item now."}]
    raw, prov = _llm(sys_text, msgs, max_tokens=900, temp=0.3, json_mode=True)
    parsed    = json.loads(raw)
    steps = parsed.get("steps")
    if not isinstance(steps, list): steps = []
    parsed["steps"]    = steps[:4]
    parsed["type"]     = "analyze"
    parsed["provider"] = prov
    return parsed


def do_chat(label, category, bin_type, conf, lang, messages):
    lang_name = LANGS.get(lang, "English")
    sys_text  = _sys_chat(label, category, bin_type, conf, lang_name)
    history   = [m for m in messages
                 if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": "Give me a brief disposal summary."}]
    text, prov = _llm(sys_text, history[-8:], max_tokens=350, temp=0.5)
    return {"type": "chat", "text": text, "lang": lang, "provider": prov}


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
            label    = d.get("label") or d.get("class") or "unknown item"
            category = d.get("category") or label
            bin_type = d.get("bin", "landfill")
            conf     = float(d.get("confidence", 0))
            lang     = d.get("lang", "en-IN")
            is_waste = d.get("is_waste", True)

            if not GROQ_KEY and not GEMINI_KEY:
                return self._send(503, {"error": "No LLM API keys set.", "disabled": True})

            if d.get("type") == "chat":
                result = do_chat(label, category, bin_type, conf, lang,
                                 d.get("messages", []))
            else:
                try:
                    result = do_analyze(label, category, bin_type, conf, lang, is_waste)
                except (json.JSONDecodeError, KeyError):
                    result = do_chat(label, category, bin_type, conf, lang, [])
                    result["type"] = "analyze_fallback"
            self._send(200, result)
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"API error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"Chat failed: {e}"})

    def log_message(self, *_):
        pass
