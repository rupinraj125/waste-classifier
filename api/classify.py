"""
POST /api/classify   body: {"image": "<dataURL or base64 jpeg/png>"}

Two identifiers:
  * Groq vision (qwen/qwen3.6-27b) — stronger on real-world photos
  * your EfficientNetV2-S via ONNX Runtime — fast, local, free

CLASSIFIER_PRIMARY = "vision" (default) -> Qwen identifies; your model is the
    fallback when Qwen errors / is unavailable, and always supplies the top-3.
CLASSIFIER_PRIMARY = "model"            -> your model identifies; Qwen is only
    consulted when the model's confidence is below FALLBACK_THRESHOLD.
Set FALLBACK_OFF=1 to never call Qwen. GROQ_VISION_MODEL to change the vision model.
"""
from http.server import BaseHTTPRequestHandler
import json, os, io, base64, urllib.request
import numpy as np
from PIL import Image
import onnxruntime as ort

_DIR   = os.path.dirname(__file__)
_MODEL = os.path.join(_DIR, "_model", "waste_classifier.onnx")
_META  = os.path.join(_DIR, "_model", "model_meta.json")

with open(_META, encoding="utf-8") as f:
    META = json.load(f)
SESS  = ort.InferenceSession(_MODEL, providers=["CPUExecutionProvider"])
IN    = SESS.get_inputs()[0].name
S     = int(META["img_size"])
MEAN  = np.array(META["mean"], dtype=np.float32)
STD   = np.array(META["std"],  dtype=np.float32)
CLASSES = META["classes"]

GROQ_KEY     = os.environ.get("GROQ_API_KEY")
VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "qwen/qwen3.6-27b")
PRIMARY      = os.environ.get("CLASSIFIER_PRIMARY", "vision").lower()  # "vision" | "model"
THRESHOLD    = float(os.environ.get("FALLBACK_THRESHOLD", "0.55"))
FALLBACK_OFF = os.environ.get("FALLBACK_OFF") == "1"
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"


def preprocess(img):
    img = img.convert("RGB").resize((S, S), Image.BILINEAR)
    x = (np.asarray(img, dtype=np.float32) / 255.0 - MEAN) / STD
    return np.transpose(x, (2, 0, 1))[None, :].astype(np.float32)


def run_model(data_url):
    b64 = data_url.split(",", 1)[1] if "," in data_url else data_url
    img = Image.open(io.BytesIO(base64.b64decode(b64)))
    logits = SESS.run(None, {IN: preprocess(img)})[0][0]
    e = np.exp(logits - logits.max()); probs = e / e.sum()
    return probs


def groq_vision(data_url):
    prompt = ("You are a waste-sorting classifier. Look at the image and choose the single best "
              "category from EXACTLY this list: " + ", ".join(CLASSES) + ". "
              "Reply with only that one word in lowercase, nothing else.")
    payload = json.dumps({
        "model": VISION_MODEL, "max_tokens": 10, "temperature": 0,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]}],
    }).encode()
    req = urllib.request.Request(GROQ_URL, data=payload,
        headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as r:
        out = json.loads(r.read())
    word = out["choices"][0]["message"]["content"].strip().lower()
    for c in CLASSES:
        if c == word or c in word:
            return c
    return None


def result_for(cls, confidence, probs, source, agree=None, model_guess=None):
    order = probs.argsort()[::-1]
    b = META["bin_info"][cls]
    out = {
        "class": cls,
        "confidence": (None if confidence is None else round(float(confidence), 4)),
        "bin": {"type": b["bin"], "color": b["color"], "emoji": b["emoji"]},
        "hazardous": bool(b["hazardous"]),
        "recyclable": b["bin"] == "recycle",
        "instructions": META["instructions"][cls],
        "common_mistake": META["common_mistakes"][cls],
        "source": source,                 # "ai_vision" | "model"
        "top3": [{"class": CLASSES[int(i)], "confidence": round(float(probs[i]), 4)} for i in order[:3]],
    }
    if agree is not None: out["agree"] = agree
    if model_guess is not None: out["model_guess"] = model_guess
    return out


def classify(data_url):
    probs = run_model(data_url)                 # always run local model (cheap -> gives top-3)
    model_top = CLASSES[int(probs.argmax())]
    model_conf = float(probs.max())
    use_vision = GROQ_KEY and not FALLBACK_OFF

    if PRIMARY == "vision" and use_vision:
        try:
            v = groq_vision(data_url)
            if v:
                return result_for(v, None, probs, "ai_vision",
                                  agree=(v == model_top), model_guess=model_top)
        except Exception:
            pass
        return result_for(model_top, model_conf, probs, "model")   # Qwen unavailable -> your model

    # PRIMARY == "model": your model leads; Qwen only double-checks weak guesses
    if use_vision and model_conf < THRESHOLD:
        try:
            v = groq_vision(data_url)
            if v and v != model_top:
                return result_for(v, None, probs, "ai_vision", agree=False, model_guess=model_top)
        except Exception:
            pass
    return result_for(model_top, model_conf, probs, "model")


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
            n = int(self.headers.get("content-length", 0))
            data = json.loads(self.rfile.read(n) or b"{}")
            if not data.get("image"):
                return self._send(400, {"error": "No image provided."})
            self._send(200, classify(data["image"]))
        except Exception as e:
            self._send(500, {"error": f"Classification failed: {e}"})
