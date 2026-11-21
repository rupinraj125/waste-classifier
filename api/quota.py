"""
GET /api/quota
Returns remaining credits/quota for Groq, Gemini, and Sarvam APIs.
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

GROQ_KEY   = os.environ.get("GROQ_API_KEY", "").strip()
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
SARVAM_KEY = os.environ.get("SARVAM_API_KEY", "").strip()


def check_groq():
    """Groq doesn't have a quota endpoint — return mock data or check by making a small call."""
    if not GROQ_KEY:
        return {"error": "No API key"}
    # Groq offers 30 req/min free tier — no direct quota API
    # We return a placeholder since there's no /v1/quota endpoint
    return {
        "status": "active",
        "plan": "Free tier",
        "limit": "30 req/min",
        "note": "No usage API available",
    }


def check_gemini():
    """Gemini Flash has 1500 RPD free tier — no direct quota endpoint either."""
    if not GEMINI_KEY:
        return {"error": "No API key"}
    # Google AI doesn't expose quota in API — return plan info
    return {
        "status": "active",
        "plan": "Free tier",
        "limit": "1500 requests/day",
        "note": "Check console.cloud.google.com for usage",
    }


def check_sarvam():
    """Sarvam AI — check if they have a quota/usage endpoint."""
    if not SARVAM_KEY:
        return {"error": "No API key"}
    
    # Try fetching account info or usage from Sarvam
    # Sarvam doesn't document a /quota endpoint, so we'll test with a minimal TTS call
    try:
        url = "https://api.sarvam.ai/text-to-speech"
        payload = json.dumps({
            "text": "test",
            "language_code": "en-IN",
            "model": "bulbul:v3",
            "speaker": "shubh",
        }).encode()
        req = urllib.request.Request(
            url, data=payload,
            headers={
                "api-subscription-key": SARVAM_KEY,
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            resp = json.loads(r.read())
            # If successful, key is active
            return {
                "status": "active",
                "plan": "Pay-as-you-go",
                "note": "Check dashboard.sarvam.ai for usage",
            }
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:200]
        if e.code == 401 or e.code == 403:
            return {"error": "Invalid or expired API key", "status": "inactive"}
        elif e.code == 429:
            return {"error": "Rate limit exceeded", "status": "limited"}
        else:
            return {"error": f"HTTP {e.code}: {err}", "status": "unknown"}
    except Exception as e:
        return {"error": str(e)[:100], "status": "unknown"}


class handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        try:
            result = {
                "groq":   check_groq(),
                "gemini": check_gemini(),
                "sarvam": check_sarvam(),
            }
            self._send(200, result)
        except Exception as e:
            self._send(500, {"error": f"Quota check failed: {e}"})

    def log_message(self, *_):
        pass
