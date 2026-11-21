"""
POST /api/chat
body: {
  "label": "plastic", "bin": "recycle", "confidence": 0.95,
  "lang": "hi-IN",
  "messages": [{"role":"user","content":"can I recycle the cap?"}, ...]
}
Returns {"text": "...", "lang": "hi-IN", "provider": "gemini"|"groq"|"fallback"}.

Provider priority:
  1. Gemini  (GEMINI_API_KEY)  — primary
  2. Groq    (GROQ_API_KEY)   — secondary
  3. Built-in model metadata  — offline fallback (returned as 200 with provider="fallback")
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
    "en-IN": "English", "hi-IN": "Hindi", "ta-IN": "Tamil", "te-IN": "Telugu",
    "kn-IN": "Kannada", "ml-IN": "Malayalam", "mr-IN": "Marathi",
    "gu-IN": "Gujarati", "bn-IN": "Bengali", "pa-IN": "Punjabi", "od-IN": "Odia",
}

OPENING = (
    "Give me a short, friendly summary of how to dispose of this item correctly, "
    "and one common mistake people make with it."
)


def system_prompt(label, bin_type, confidence, lang_name):
    return (
        "You are a friendly, practical waste-sorting assistant for households in India. "
        f"The user photographed an item identified as '{label}', which belongs in the "
        f"'{bin_type}' bin (model confidence {confidence:.0%}). Help them dispose of it "
        "correctly: recycling, reuse, cleaning, hazards, and common Indian local practice. "
        f"Reply ONLY in {lang_name}. Keep replies short (2-4 sentences), warm and plain, "
        "and suitable to be read aloud. No markdown, no bullet characters, no emojis."
    )


# ---------------------------------------------------------------------------
# Gemini  (primary)
# ---------------------------------------------------------------------------
def _call_gemini(label, bin_type, confidence, lang, messages):
    """Returns (text, 'gemini') or raises."""
    lang_name = LANGS.get(lang, "English")
    sys_text  = system_prompt(label, bin_type, confidence, lang_name)

    history = [m for m in messages if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": OPENING}]
    history = history[-8:]

    # Gemini uses 'model' instead of 'assistant'
    def _role(r):
        return "model" if r == "assistant" else r

    contents = [{"role": _role(m["role"]), "parts": [{"text": m["content"]}]} for m in history]

    payload = json.dumps({
        "system_instruction": {"parts": [{"text": sys_text}]},
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 320,
            "temperature": 0.5,
        },
    }).encode()

    req = urllib.request.Request(
        GEMINI_URL, data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        out = json.loads(r.read())

    text = out["candidates"][0]["content"]["parts"][0]["text"].strip()
    return text, "gemini"


# ---------------------------------------------------------------------------
# Groq  (secondary)
# ---------------------------------------------------------------------------
def _call_groq(label, bin_type, confidence, lang, messages):
    """Returns (text, 'groq') or raises."""
    lang_name = LANGS.get(lang, "English")
    convo = [{"role": "system", "content": system_prompt(label, bin_type, confidence, lang_name)}]
    history = [m for m in messages if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": OPENING}]
    convo += history[-8:]

    payload = json.dumps({
        "model": GROQ_MODEL, "messages": convo, "max_tokens": 320, "temperature": 0.5,
    }).encode()
    req = urllib.request.Request(
        GROQ_URL, data=payload,
        headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        out = json.loads(r.read())
    return out["choices"][0]["message"]["content"].strip(), "groq"


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------
def chat(label, bin_type, confidence, lang, messages):
    """Try Gemini -> Groq -> raise (caller handles fallback)."""
    errors = []

    if GEMINI_KEY:
        try:
            return _call_gemini(label, bin_type, confidence, lang, messages)
        except Exception as e:
            errors.append(f"gemini: {e}")

    if GROQ_KEY:
        try:
            return _call_groq(label, bin_type, confidence, lang, messages)
        except Exception as e:
            errors.append(f"groq: {e}")

    raise RuntimeError("; ".join(errors) or "No API keys configured.")


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
            text, provider = chat(
                label, d.get("bin", "general"), float(d.get("confidence", 0)),
                lang, d.get("messages", [])
            )
            self._send(200, {"text": text, "lang": lang, "provider": provider})
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"API error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"Chat failed: {e}"})

    def log_message(self, *_):
        pass
