"""
GET /api/quota
Returns remaining credits/quota for Groq, Gemini, and Sarvam APIs.
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

GROQ_KEY   = os.environ.get("GROQ_API_KEY", "").strip()
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
SARVAM_KEY = os.environ.get("SARVAM_API_KEY", "").strip()
SARVAM_KEY_FALLBACK = os.environ.get("SARVAM_API_KEY_FALLBACK", "").strip()


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
    """Sarvam AI — test primary + fallback keys, return both statuses."""
    if not SARVAM_KEY and not SARVAM_KEY_FALLBACK:
        return {"error": "No API keys configured", "status": "inactive"}
    
    primary_status = None
    fallback_status = None
    
    # Check primary key
    if SARVAM_KEY:
        primary_status = _test_sarvam_key(SARVAM_KEY, "Primary")
    
    # Check fallback key
    if SARVAM_KEY_FALLBACK:
        fallback_status = _test_sarvam_key(SARVAM_KEY_FALLBACK, "Fallback")
    
    # Build response with details for both keys
    keys = []
    if primary_status:
        keys.append({
            "label": "Primary",
            "status": primary_status.get("status", "unknown"),
            "error": primary_status.get("error"),
        })
    if fallback_status:
        keys.append({
            "label": "Fallback",
            "status": fallback_status.get("status", "unknown"),
            "error": fallback_status.get("error"),
        })
    
    # Determine overall status
    active_count = sum(1 for k in keys if k["status"] == "active")
    
    if active_count == len(keys):
        overall_status = "active"
        note = f"All {len(keys)} key(s) active"
    elif active_count > 0:
        overall_status = "active"
        note = f"{active_count}/{len(keys)} key(s) active"
    else:
        overall_status = "inactive"
        note = "All keys exhausted or invalid"
    
    return {
        "status": overall_status,
        "plan": "Pay-as-you-go",
        "model": "bulbul:v3",
        "note": note,
        "keys": keys,  # detailed status per key
    }


def _test_sarvam_key(api_key: str, label: str):
    """Test a single Sarvam key."""
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
                "api-subscription-key": api_key,
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            resp = json.loads(r.read())
            if resp.get("audios"):
                return {"status": "active", "label": label}
            return {"status": "unknown", "error": "No audio", "label": label}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:300]
        if e.code == 401 or e.code == 403:
            return {"status": "inactive", "error": "Invalid key", "label": label}
        elif e.code == 402:
            try:
                err_json = json.loads(err_body)
                err_msg = err_json.get("error", {}).get("message", "No credits")
            except:
                err_msg = "Insufficient credits"
            return {"status": "inactive", "error": err_msg, "label": label}
        elif e.code == 429:
            return {"status": "limited", "error": "Rate limit", "label": label}
        else:
            return {"status": "unknown", "error": f"HTTP {e.code}", "label": label}
    except Exception as e:
        return {"status": "unknown", "error": str(e)[:100], "label": label}


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
