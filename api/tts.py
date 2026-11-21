"""
POST /api/tts
body: {
  "text":          "...",
  "language_code": "hi-IN",
  "speaker":       "ishita",
  "full":          false,
  "pace":          1.0
}

Uses Sarvam bulbul:v3 — the best Indic TTS model.
Speaker defaults are chosen per language for the most natural emotion.
Pace defaults are tuned per language (Indian languages need slightly slower pace).
Full text limit: 2400 chars. Fast path: first sentence only (~220 chars).
"""
from http.server import BaseHTTPRequestHandler
import json, os, re, urllib.request, urllib.error

KEY   = os.environ.get("SARVAM_API_KEY", "").strip()
URL   = "https://api.sarvam.ai/text-to-speech"
MODEL = "bulbul:v3"   # always use v3 — best quality for all Indian languages

# Best speaker per language for natural emotion
# Male voices: shubh, aditya, rahul, rohan
# Female voices: ishita, priya, neha, pooja
LANG_DEFAULTS = {
    "en-IN": {"speaker": "ishita", "pace": 1.08},   # English — slightly fast, clear
    "hi-IN": {"speaker": "advait", "pace": 0.95},   # Hindi — a bit slower, warm
    "ta-IN": {"speaker": "ishita", "pace": 0.92},   # Tamil — slower for Tanglish clarity
    "te-IN": {"speaker": "advait", "pace": 0.93},   # Telugu
    "kn-IN": {"speaker": "advait", "pace": 0.93},   # Kannada
    "ml-IN": {"speaker": "advait", "pace": 0.90},   # Malayalam — slowest, melodic
    "mr-IN": {"speaker": "advait", "pace": 0.95},   # Marathi
    "gu-IN": {"speaker": "advait", "pace": 0.95},   # Gujarati
    "bn-IN": {"speaker": "advait", "pace": 0.93},   # Bengali
    "pa-IN": {"speaker": "advait", "pace": 0.97},   # Punjabi
    "od-IN": {"speaker": "advait", "pace": 0.92},   # Odia
}

FAST_LIMIT = 240   # slightly larger for Indian languages with longer words

def _trim(text: str, full: bool) -> str:
    if full:
        return text[:2400]
    # Split on sentence-ending punctuation
    parts = re.split(r'(?<=[.!?।\u0964])\s+', text.strip())
    out   = ""
    for p in parts:
        candidate = (out + " " + p).strip()
        if len(candidate) <= FAST_LIMIT:
            out = candidate
        else:
            if not out:
                out = candidate[:FAST_LIMIT]
            break
    return out or text[:FAST_LIMIT]


def synthesize(text: str, lang: str, speaker: str, pace: float) -> str:
    payload = json.dumps({
        "text":               text,
        "language_code":      lang,
        "model":              MODEL,
        "speaker":            speaker,
        "output_audio_codec": "mp3",
        "pace":               round(max(0.6, min(1.5, pace)), 2),
    }, ensure_ascii=False).encode()

    req = urllib.request.Request(
        URL, data=payload,
        headers={"api-subscription-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        out = json.loads(r.read())
    audios = out.get("audios") or []
    if not audios:
        raise RuntimeError(f"Sarvam returned no audio. Response: {out}")
    return audios[0]


class handler(BaseHTTPRequestHandler):
    def _send(self, code: int, obj: dict):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            if not KEY:
                return self._send(503, {"error": "SARVAM_API_KEY not set", "disabled": True})
            n        = int(self.headers.get("content-length", 0))
            d        = json.loads(self.rfile.read(n) or b"{}")
            raw_text = (d.get("text") or "").strip()
            if not raw_text:
                return self._send(400, {"error": "No text provided."})

            lang    = d.get("language_code", "en-IN")
            defaults = LANG_DEFAULTS.get(lang, LANG_DEFAULTS["en-IN"])

            # Speaker: request body → env var → language default
            speaker = (
                d.get("speaker")
                or os.environ.get("SARVAM_SPEAKER", "")
                or defaults["speaker"]
            ).strip()

            # Pace: request body → language default
            pace = float(d.get("pace") or defaults["pace"])

            text  = _trim(raw_text, bool(d.get("full")))
            audio = synthesize(text, lang, speaker, pace)
            self._send(200, {"audio": audio, "mime": "audio/mpeg"})

        except urllib.error.HTTPError as e:
            err = e.read().decode()[:300]
            self._send(502, {"error": f"Sarvam error {e.code}: {err}"})
        except Exception as e:
            self._send(500, {"error": f"TTS failed: {e}"})

    def log_message(self, *_):
        pass
