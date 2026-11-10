# Which Bin? — mobile waste-sorting web app

Snap a photo of an item on your phone, and it tells you which bin it goes in,
how to dispose of it, and reads the guidance aloud.

- **Vision model:** your trained EfficientNetV2-S, exported to ONNX (93.6% val / 95.5% test accuracy, 11 classes).
- **Runs on:** Vercel — static frontend + three Python serverless functions. No separate server.

## Why ONNX and not the .pkl here

The `.pkl` needs PyTorch + timm (1–2 GB) to load — too heavy and too slow to cold-start
on serverless. ONNX Runtime is ~50 MB and loads the 80 MB model in a second or two, so the
classifier fits comfortably as a Vercel function. Keep the `.pkl` as your training artifact;
`waste_classifier.onnx` is the deploy artifact. (If you ever re-export, the ONNX input is
**192×192** for this model — preprocessing is driven by `model_meta.json`, so it stays correct.)

## What's inside

```
public/index.html        Mobile web UI: camera, result, language picker, chat — no build step
api/classify.py          ONNX Runtime inference  -> {class, bin, confidence, tips, top3}
api/chat.py              Groq chatbot -> replies IN the chosen language (opening + follow-ups)
api/tts.py               Sarvam Bulbul TTS -> spoken audio in the chosen Indian language
api/_model/              waste_classifier.onnx + model_meta.json
requirements.txt         onnxruntime, numpy, pillow
vercel.json              bundles the model with classify; memory/duration
.env.example             your two API keys
```

**How the three pieces work together:** the vision model names the item and bin; **Groq** is a
chat assistant you can keep asking ("can I recycle the cap?", "how do I clean it?") — every reply
is generated in the language picked from the dropdown; **Sarvam** speaks any reply aloud in that
same Indian language via the Listen button on each message.

Languages in the picker: English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം, मराठी, ગુજરાતી, বাংলা,
ਪੰਜਾਬੀ, ଓଡ଼ିଆ. Changing it affects new replies and new audio.

The classifier itself works with no keys (shows the model's built-in English tip). With your two
keys set, you get the full chat + multilingual voice experience.

## Deploy to Vercel (≈5 minutes)

1. Push this folder to a GitHub repo. The model file is ~80 MB — fine for GitHub (under the
   100 MB limit). Don't add it to `.gitignore`; it must deploy.
2. On vercel.com: **Add New → Project → Import** your repo. Framework preset: **Other**.
   Leave build/output settings empty — Vercel serves `public/` statically and `api/*.py` as
   functions automatically.
3. (Optional) **Settings → Environment Variables**, add `GROQ_API_KEY` and/or `SARVAM_API_KEY`.
   Redeploy after adding keys.
4. **Deploy.** Open the URL on your phone. On first use the browser asks for camera permission.

Get keys: Groq → console.groq.com/keys · Sarvam → dashboard.sarvam.ai

## Run locally

```
npm i -g vercel          # one time
vercel dev               # serves the whole thing at http://localhost:3000
```
Put your keys in a local `.env` (copy from `.env.example`). Without Vercel CLI you can't run the
Python functions locally, but you can still open `public/index.html` to see the UI.

## Notes & knobs

- **Image size:** the frontend downscales photos to 512 px / JPEG before upload, so request
  bodies stay tiny (well under Vercel's 4.5 MB limit) and classification is fast.
- **Language:** the app sends the dropdown's language code to both Groq (so the reply text is in
  that language) and Sarvam (so it's pronounced correctly). You don't set a language env var.
- **Sarvam speaker:** `shubh` (bulbul:v3 default) is multilingual across all 11 languages. If TTS
  ever returns an "invalid speaker" error, pick one from the dashboard and set `SARVAM_SPEAKER`.
- **Cold starts:** the first classify after idle takes a few seconds (model load); subsequent
  calls are ~100–300 ms while the container stays warm.
- **Use ElevenLabs instead of Sarvam:** in `api/tts.py`, change the URL to
  `https://api.elevenlabs.io/v1/text-to-speech/<voice_id>`, send header `xi-api-key`, body
  `{"text":..., "model_id":"eleven_multilingual_v2"}`, and return the raw audio bytes as base64
  (ElevenLabs returns audio directly, not JSON).

## Accuracy, honestly

11 classes, 95.5% on the held-out test set. Weakest spots from the confusion matrix: `metal`
and `trash` are occasionally confused with neighbours. Treat the result as guidance — for
anything hazardous (batteries especially), follow local disposal rules.
