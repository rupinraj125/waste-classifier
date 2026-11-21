"""Test Sarvam bulbul:v4 API with actual request."""
import json, os, urllib.request, urllib.error

# Load .env
with open(".env") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

KEY = os.environ.get("SARVAM_API_KEY", "").strip()
if not KEY:
    print("❌ No SARVAM_API_KEY in .env")
    raise SystemExit

URL = "https://api.sarvam.ai/text-to-speech"

# Test 1: bulbul:v4 with all our params
print("Testing bulbul:v4 with pitch/pace...\n")
payload = {
    "text": "यह एक परीक्षण है।",
    "language_code": "hi-IN",
    "model": "bulbul:v4",
    "speaker": "advait",
    "output_audio_codec": "mp3",
    "pace": 0.95,
    "pitch": -0.1,
}

print(f"Request payload:\n{json.dumps(payload, indent=2, ensure_ascii=False)}\n")

try:
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers={
            "api-subscription-key": KEY,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        resp = json.loads(r.read())
        if resp.get("audios"):
            print("✅ Success! Audio generated.")
            print(f"   Audio length: {len(resp['audios'][0])} chars (base64)")
        else:
            print(f"⚠️  Unexpected response: {resp}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode()
    print(f"❌ HTTP {e.code} Error:\n{err_body}\n")
    
    # Try without pitch (maybe v4 doesn't support it?)
    print("Retrying without pitch parameter...")
    payload.pop("pitch", None)
    try:
        req = urllib.request.Request(
            URL,
            data=json.dumps(payload).encode(),
            headers={
                "api-subscription-key": KEY,
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = json.loads(r.read())
            if resp.get("audios"):
                print("✅ Success without pitch! (v4 may not support pitch)")
            else:
                print(f"⚠️  Response: {resp}")
    except urllib.error.HTTPError as e2:
        print(f"❌ Still failed: HTTP {e2.code}\n{e2.read().decode()}")
except Exception as e:
    print(f"❌ Exception: {e}")
