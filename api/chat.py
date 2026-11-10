"""
POST /api/chat
body: {
  "label": "plastic", "bin": "recycle", "confidence": 0.95,
  "lang": "hi-IN",                      # drives the REPLY language (and TTS later)
  "messages": [{"role":"user","content":"can I recycle the cap?"}, ...]   # may be empty
}
Returns {"text": "...", "lang": "hi-IN"}.

If "messages" is empty, returns an opening summary for the item.
Groq replies IN the chosen language, so Sarvam can speak it naturally.
Falls back to 503 if GROQ_API_KEY is unset (frontend then shows built-in tips).
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

KEY   = os.environ.get("GROQ_API_KEY")
MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
URL   = "https://api.groq.com/openai/v1/chat/completions"

LANGS = {
    "en-IN": "English", "hi-IN": "Hindi", "ta-IN": "Tamil", "te-IN": "Telugu",
    "kn-IN": "Kannada", "ml-IN": "Malayalam", "mr-IN": "Marathi",
    "gu-IN": "Gujarati", "bn-IN": "Bengali", "pa-IN": "Punjabi", "od-IN": "Odia",
}

OPENING = ("Give me a short, friendly summary of how to dispose of this item correctly, "
           "and one common mistake people make with it.")


def system_prompt(label, bin_type, confidence, lang_name):
    return (
        "You are a friendly, practical waste-sorting assistant for households in India. "
        f"The user photographed an item identified as '{label}', which belongs in the "
        f"'{bin_type}' bin (model confidence {confidence:.0%}). Help them dispose of it "
        "correctly: recycling, reuse, cleaning, hazards, and common Indian local practice. "
        f"Reply ONLY in {lang_name}. Keep replies short (2-4 sentences), warm and plain, "
        "and suitable to be read aloud. No markdown, no bullet characters, no emojis."
    )


def chat(label, bin_type, confidence, lang, messages):
    lang_name = LANGS.get(lang, "English")
    convo = [{"role": "system", "content": system_prompt(label, bin_type, confidence, lang_name)}]
    history = [m for m in messages if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": OPENING}]
    convo += history[-8:]   # keep context bounded
    payload = json.dumps({
        "model": MODEL, "messages": convo, "max_tokens": 320, "temperature": 0.5,
    }).encode()
    req = urllib.request.Request(
        URL, data=payload,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        out = json.loads(r.read())
    return out["choices"][0]["message"]["content"].strip()


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
            if not KEY:
                return self._send(503, {"error": "GROQ_API_KEY not set", "disabled": True})
            n = int(self.headers.get("content-length", 0))
            d = json.loads(self.rfile.read(n) or b"{}")
            label = d.get("label") or d.get("class")
            if not label:
                return self._send(400, {"error": "No label provided."})
            lang = d.get("lang", "en-IN")
            text = chat(label, d.get("bin", "general"), float(d.get("confidence", 0)),
                        lang, d.get("messages", []))
            self._send(200, {"text": text, "lang": lang})
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"Groq error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"Chat failed: {e}"})
