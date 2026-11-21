"""
POST /api/tts
body: { "text", "language_code", "speaker", "full", "pace" }

Uses Sarvam bulbul:v3. Pitch and pace are tuned per language for natural emotion.
bulbul:v3 accepts pitch in range -1.0 to 1.0 (0.0 = neutral).
"""
from http.server import BaseHTTPRequestHandler
import json, os, re, urllib.request, urllib.error

KEY   = os.environ.get("SARVAM_API_KEY", "").strip()
URL   = "https://api.sarvam.ai/text-to-speech"
MODEL = "bulbul:v3"

# Tuned per language: speaker, pace, pitch
# pitch:  >0 = higher/brighter,  <0 = deeper/warmer
# pace:   >1.0 = faster,          <1.0 = slower
LANG_DEFAULTS = {
    "en-IN": {"speaker": "ishita",  "pace": 1.08, "pitch":  0.1},   # crisp, clear
    "hi-IN": {"speaker": "advait",  "pace": 0.95, "pitch": -0.1},   # warm, steady
    "ta-IN": {"speaker": "ishita",  "pace": 0.90, "pitch":  0.0},   # natural Tamil
    "te-IN": {"speaker": "advait",  "pace": 0.92, "pitch": -0.05},  # Telugu rhythm
    "kn-IN": {"speaker": "advait",  "pace": 0.92, "pitch": -0.05},  # Kannada rhythm
    "ml-IN": {"speaker": "advait",  "pace": 0.88, "pitch": -0.15},  # Malayalam — melodic, deeper
    "mr-IN": {"speaker": "advait",  "pace": 0.95, "pitch":  0.0},   # Marathi
    "gu-IN": {"speaker": "advait",  "pace": 0.95, "pitch":  0.05},  # Gujarati — slightly brighter
    "bn-IN": {"speaker": "advait",  "pace": 0.92, "pitch": -0.05},  # Bengali
    "pa-IN": {"speaker": "advait",  "pace": 0.97, "pitch":  0.0},   # Punjabi
    "od-IN": {"speaker": "advait",  "pace": 0.90, "pitch": -0.05},  # Odia
}

FAST_LIMIT = 240


def _trim(text: str, full: bool) -> str:
    if full:
        return text[:2400]
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


def synthesize(text: str, lang: str, speaker: str, pace: float, pitch: float) -> str:
    payload = json.dumps({
        "text":               text,
        "language_code":      lang,
        "model":              MODEL,
        "speaker":            speaker,
        "output_audio_codec": "mp3",
        "pace":               round(max(0.6, min(1.5,  pace)),  2),
        "pitch":              round(max(-1.0, min(1.0, pitch)), 2),
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

            lang     = d.get("language_code", "en-IN")
            defaults = LANG_DEFAULTS.get(lang, LANG_DEFAULTS["en-IN"])

            speaker = (
                d.get("speaker")
                or os.environ.get("SARVAM_SPEAKER", "")
                or defaults["speaker"]
            ).strip()

            pace  = float(d.get("pace")  or defaults["pace"])
            pitch = float(d.get("pitch") or defaults["pitch"])

            text  = _trim(raw_text, bool(d.get("full")))
            audio = synthesize(text, lang, speaker, pace, pitch)
            self._send(200, {"audio": audio, "mime": "audio/mpeg"})

        except urllib.error.HTTPError as e:
            err = e.read().decode()[:300]
            self._send(502, {"error": f"Sarvam error {e.code}: {err}"})
        except Exception as e:
            self._send(500, {"error": f"TTS failed: {e}"})

    def log_message(self, *_):
        pass
