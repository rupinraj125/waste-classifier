"""
POST /api/classify   body: {"image": "<dataURL or base64 jpeg/png>"}

Pipeline (100% Groq, no Gemini dependency):
  1. Groq vision  (qwen/qwen3.8-27b, ~0.5 s)
       → identifies the REAL item in the image
       → returns item_name, waste_category, is_waste, confidence
       Fixes the core bug: ONNX only knows 11 classes and misclassifies
       laptops as "paper", headphones as "shoes", etc.

  2. Local ONNX   (EfficientNetV2-S, CPU, ~50 ms)
       → always runs for the top-3 confidence bars shown in the UI
       → its label is NOT the primary result when Groq vision is available

  3. If GROQ_API_KEY is unset, falls back to ONNX-only.
"""
from http.server import BaseHTTPRequestHandler
import json, os, io, base64, urllib.request, urllib.error
import numpy as np
from PIL import Image
import onnxruntime as ort

_DIR   = os.path.dirname(__file__)
_META  = os.path.join(_DIR, "_model", "model_meta.json")
_MODEL = os.path.join(_DIR, "_model", "waste_classifier.onnx")

with open(_META, encoding="utf-8") as f:
    META = json.load(f)

SESS    = ort.InferenceSession(_MODEL, providers=["CPUExecutionProvider"])
IN_NAME = SESS.get_inputs()[0].name
S       = int(META["img_size"])
MEAN    = np.array(META["mean"], dtype=np.float32)
STD     = np.array(META["std"],  dtype=np.float32)
CLASSES = META["classes"]   # 11 ONNX classes

GROQ_KEY    = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_URL    = "https://api.groq.com/openai/v1/chat/completions"
VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
UA           = "WasteSorterApp/2.0"

# Bin info for categories beyond the 11 ONNX classes
EXTRA_BINS = {
    "electronics": {"bin": "hazardous", "color": "red",   "emoji": "⚠️",  "hazardous": True},
    "e-waste":     {"bin": "hazardous", "color": "red",   "emoji": "⚠️",  "hazardous": True},
    "food":        {"bin": "compost",   "color": "brown", "emoji": "🟤", "hazardous": False},
    "textile":     {"bin": "landfill",  "color": "black", "emoji": "🗑️", "hazardous": False},
    "furniture":   {"bin": "landfill",  "color": "black", "emoji": "🗑️", "hazardous": False},
    "other":       {"bin": "landfill",  "color": "black", "emoji": "🗑️", "hazardous": False},
}
ALL_BINS = {**META["bin_info"], **EXTRA_BINS}

VISION_PROMPT = (
    "You are a waste classification expert. "
    "Look at the image carefully and identify the EXACT item shown.\n\n"
    "Reply ONLY as a valid JSON object — no markdown, no extra text:\n"
    "{\"item_name\":\"exact name of what you see, e.g. laptop, headphones, plastic bottle, banana peel\","
    "\"waste_category\":\"one of: plastic, glass, metal, cardboard, paper, biological, battery, "
    "electronics, clothes, shoes, vegetation, food, textile, furniture, trash, other\","
    "\"is_waste\":true,"
    "\"confidence\":0.9}\n\n"
    "Rules:\n"
    "- item_name must be the SPECIFIC item, not a generic waste type.\n"
    "- Laptops, phones, tablets, headphones, cables, chargers, TVs → electronics\n"
    "- AA/AAA/button batteries → battery\n"
    "- Food scraps → biological\n"
    "- is_waste is false only if the item is clearly not disposable (e.g. a person).\n"
    "- confidence: 0.0–1.0 based on how clearly you can see the item."
)


def _run_onnx(raw_b64: str):
    """Returns top3 list. Never raises."""
    try:
        img  = Image.open(io.BytesIO(base64.b64decode(raw_b64))).convert("RGB").resize((S, S), Image.BILINEAR)
        x    = (np.asarray(img, dtype=np.float32) / 255.0 - MEAN) / STD
        x    = np.transpose(x, (2, 0, 1))[None, :].astype(np.float32)
        logits = SESS.run(None, {IN_NAME: x})[0][0]
        e    = np.exp(logits - logits.max()); probs = e / e.sum()
        order = probs.argsort()[::-1]
        return [{"class": CLASSES[int(i)], "confidence": round(float(probs[i]), 4)}
                for i in order[:3]]
    except Exception:
        return []


def _groq_vision(data_url: str) -> dict:
    """Calls Groq multimodal. Returns parsed dict. Raises on failure."""
    body = json.dumps({
        "model":    VISION_MODEL,
        "max_tokens": 150,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": data_url}},
            {"type": "text",      "text": VISION_PROMPT},
        ]}],
    }, ensure_ascii=False).encode()

    req = urllib.request.Request(
        GROQ_URL, data=body,
        headers={"Authorization": f"Bearer {GROQ_KEY}",
                 "Content-Type": "application/json", "User-Agent": UA},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        out = json.loads(r.read())
    return json.loads(out["choices"][0]["message"]["content"].strip())


def classify(data_url: str) -> dict:
    raw_b64 = data_url.split(",", 1)[1] if "," in data_url else data_url
    top3    = _run_onnx(raw_b64)   # always run for UI confidence bars

    if GROQ_KEY:
        try:
            v        = _groq_vision(data_url)
            item     = str(v.get("item_name",      "unknown item")).strip()
            cat      = str(v.get("waste_category", "other")).lower().strip()
            is_waste = bool(v.get("is_waste", True))
            conf     = float(v.get("confidence", 0.85))
            bin_info = ALL_BINS.get(cat, EXTRA_BINS["other"])
            return {
                "class":      item,
                "category":   cat,
                "confidence": round(conf, 4),
                "bin":        {"type":  bin_info["bin"],
                               "color": bin_info["color"],
                               "emoji": bin_info["emoji"]},
                "hazardous":  bool(bin_info["hazardous"]),
                "recyclable": bin_info["bin"] == "recycle",
                "is_waste":   is_waste,
                "source":     "groq_vision",
                "top3":       top3,
            }
        except Exception:
            pass   # fall through to ONNX

    # ONNX fallback
    if top3:
        tc = top3[0]["class"]; cf = top3[0]["confidence"]
    else:
        tc = "trash"; cf = 0.5
    b = META["bin_info"][tc]
    return {
        "class":      tc,
        "category":   tc,
        "confidence": cf,
        "bin":        {"type": b["bin"], "color": b["color"], "emoji": b["emoji"]},
        "hazardous":  bool(b["hazardous"]),
        "recyclable": b["bin"] == "recycle",
        "is_waste":   True,
        "source":     "onnx",
        "top3":       top3,
        "instructions":   META["instructions"].get(tc, ""),
        "common_mistake": META["common_mistakes"].get(tc, ""),
    }


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
            n    = int(self.headers.get("content-length", 0))
            data = json.loads(self.rfile.read(n) or b"{}")
            if not data.get("image"):
                return self._send(400, {"error": "No image provided."})
            self._send(200, classify(data["image"]))
        except Exception as e:
            self._send(500, {"error": f"Classification failed: {e}"})

    def log_message(self, *_):
        pass
