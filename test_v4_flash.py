"""Test both bulbul:v3 and bulbul:v4-flash to compare."""
import json, os, urllib.request, time

with open(".env") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

KEY = os.environ.get("SARVAM_API_KEY", "").strip()
URL = "https://api.sarvam.ai/text-to-speech"

def test_model(model_name):
    print(f"\n{'='*60}")
    print(f"Testing: {model_name}")
    print('='*60)
    
    payload = {
        "text": "Separate your dry and wet waste properly.",
        "language_code": "en-IN",
        "model": model_name,
        "speaker": "ishita",
        "output_audio_codec": "mp3",
        "pace": 1.0,
        "pitch": 0.0,
    }
    
    try:
        t0 = time.perf_counter()
        req = urllib.request.Request(URL, data=json.dumps(payload).encode(),
            headers={"api-subscription-key": KEY, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as r:
            resp = json.loads(r.read())
        elapsed = time.perf_counter() - t0
        
        if resp.get("audios"):
            audio_len = len(resp['audios'][0])
            print(f"✅ SUCCESS")
            print(f"   Response time: {elapsed:.2f}s")
            print(f"   Audio size: {audio_len:,} chars (base64)")
            print(f"   Approx MP3 size: {audio_len * 3 // 4 / 1024:.1f} KB")
            return True
        else:
            print(f"⚠️  Unexpected response: {resp}")
            return False
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP {e.code}: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

# Test both
v3_ok = test_model("bulbul:v3")
time.sleep(0.5)
v4_flash_ok = test_model("bulbul:v4-flash")

print(f"\n{'='*60}")
print("SUMMARY")
print('='*60)
print(f"bulbul:v3       → {'✅ Works' if v3_ok else '❌ Failed'}")
print(f"bulbul:v4-flash → {'✅ Works' if v4_flash_ok else '❌ Failed'}")
print("\nRecommendation:")
if v4_flash_ok:
    print("Use bulbul:v4-flash — faster, newer model")
elif v3_ok:
    print("Use bulbul:v3 — v4-flash not available on your key")
else:
    print("❌ Neither model works — check API key")
