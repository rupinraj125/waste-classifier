"""
POST /api/tts
body: {
  "text":          "...",
  "language_code": "hi-IN",
  "speaker":       "ishita",   ← optional, overrides SARVAM_SPEAKER
  "full":          false        ← if true, send full text (not trimmed)
}
Returns {"audio": "<base64 mp3>", "mime": "audio/mpeg"}.
Returns {"disabled": true} with 503 if SARVAM_API_KEY is unset.

Speed: text is trimmed to the first sentence / 220 chars by default
so Sarvam responds in ~1-2 s. Pass full:true for "read all steps" mode.
"""
from http.server import BaseHTTPRequestHandler
import json, os, re, urllib.request, urllib.error

KEY     = os.environ.get("SARVAM_API_KEY", "").strip()
URL     = "https://api.sarvam.ai/text-to-speech"
MODEL   = os.environ.get("SARVAM_MODEL",   "bulbul:v3")
DEFAULT_SPEAKER = os.environ.get("SARVAM_SPEAKER", "shubh")
FAST_LIMIT = 220


def _trim(text: str, full: bool) -> str:
    if full:
        return text[:2400]
    parts = re.split(r'(?<=[.!?।])\s+', text.strip())
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


def synthesize(text: str, lang: str, speaker: str) -> str:
    payload = json.dumps({
        "text":               text,
        "language_code":      lang,
        "model":              MODEL,
        "speaker":            speaker,
        "output_audio_codec": "mp3",
        "pace":               1.05,
    }).encode()
    req = urllib.request.Request(
        URL, data=payload,
        headers={"api-subscription-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        out = json.loads(r.read())
    audios = out.get("audios") or []
    if not audios:
        raise RuntimeError("Sarvam returned no audio.")
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
            speaker  = (d.get("speaker") or DEFAULT_SPEAKER).strip()
            text     = _trim(raw_text, bool(d.get("full")))
            audio    = synthesize(text, d.get("language_code", "en-IN"), speaker)
            self._send(200, {"audio": audio, "mime": "audio/mpeg"})
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"Sarvam error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"TTS failed: {e}"})

    def log_message(self, *_):
        pass
