"""
POST /api/classify   body: {"image": "<dataURL or base64 jpeg/png>"}
Runs the EfficientNetV2-S waste classifier via ONNX Runtime (no PyTorch).
The model + metadata are loaded once per warm container.
"""
from http.server import BaseHTTPRequestHandler
import json, os, io, base64
import numpy as np
from PIL import Image
import onnxruntime as ort

_DIR   = os.path.dirname(__file__)
_MODEL = os.path.join(_DIR, "_model", "waste_classifier.onnx")
_META  = os.path.join(_DIR, "_model", "model_meta.json")

# Loaded once, reused across warm invocations.
with open(_META, encoding="utf-8") as f:
    META = json.load(f)
SESS  = ort.InferenceSession(_MODEL, providers=["CPUExecutionProvider"])
IN    = SESS.get_inputs()[0].name
S     = int(META["img_size"])
MEAN  = np.array(META["mean"], dtype=np.float32)
STD   = np.array(META["std"],  dtype=np.float32)


def preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize((S, S), Image.BILINEAR)
    x = (np.asarray(img, dtype=np.float32) / 255.0 - MEAN) / STD
    return np.transpose(x, (2, 0, 1))[None, :].astype(np.float32)


def classify(data_url: str) -> dict:
    b64 = data_url.split(",", 1)[1] if "," in data_url else data_url
    img = Image.open(io.BytesIO(base64.b64decode(b64)))
    logits = SESS.run(None, {IN: preprocess(img)})[0][0]
    e = np.exp(logits - logits.max())
    probs = e / e.sum()
    order = probs.argsort()[::-1]
    classes, bins = META["classes"], META["bin_info"]
    top = classes[int(order[0])]
    b = bins[top]
    return {
        "class": top,
        "confidence": round(float(probs[order[0]]), 4),
        "bin": {"type": b["bin"], "color": b["color"], "emoji": b["emoji"]},
        "hazardous": bool(b["hazardous"]),
        "recyclable": b["bin"] == "recycle",
        "instructions": META["instructions"][top],
        "common_mistake": META["common_mistakes"][top],
        "top3": [
            {"class": classes[int(i)], "confidence": round(float(probs[i]), 4)}
            for i in order[:3]
        ],
    }


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
            n = int(self.headers.get("content-length", 0))
            data = json.loads(self.rfile.read(n) or b"{}")
            if not data.get("image"):
                return self._send(400, {"error": "No image provided."})
            self._send(200, classify(data["image"]))
        except Exception as e:
            self._send(500, {"error": f"Classification failed: {e}"})
