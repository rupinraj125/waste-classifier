"""
POST /api/tts  body: {"text": "...", "language_code": "en-IN"}
Returns {"audio": "<base64 mp3>", "mime": "audio/mpeg"} via Sarvam Bulbul.
Optional: if SARVAM_API_KEY is not set, returns 503 and the app hides "Listen".

To use ElevenLabs instead, see README (swap URL/headers/body/response field).
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

KEY     = os.environ.get("SARVAM_API_KEY")
URL     = "https://api.sarvam.ai/text-to-speech"
MODEL   = os.environ.get("SARVAM_MODEL", "bulbul:v3")
SPEAKER = os.environ.get("SARVAM_SPEAKER", "shubh")   # valid speakers depend on model (see README)
LANG    = os.environ.get("SARVAM_LANG", "en-IN")


def synthesize(text: str, lang: str) -> str:
    payload = json.dumps({
        "text": text[:2400],
        "language_code": lang,
        "model": MODEL,
        "speaker": SPEAKER,
        "output_audio_codec": "mp3",
    }).encode()
    req = urllib.request.Request(
        URL, data=payload,
        headers={"api-subscription-key": KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        out = json.loads(r.read())
    audios = out.get("audios") or []
    if not audios:
        raise RuntimeError("Sarvam returned no audio.")
    return audios[0]  # base64 mp3


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
            n = int(self.headers.get("content-length", 0))
            d = json.loads(self.rfile.read(n) or b"{}")
            text = (d.get("text") or "").strip()
            if not text:
                return self._send(400, {"error": "No text provided."})
            audio = synthesize(text, d.get("language_code", LANG))
            self._send(200, {"audio": audio, "mime": "audio/mpeg"})
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"Sarvam error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"TTS failed: {e}"})
