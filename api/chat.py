"""
POST /api/chat — Groq primary, Gemini fallback.

Mode 1 — type="analyze"
  Returns JSON with ALL strings in the chosen language/style.
  - If not waste (human, food still being eaten, furniture in use): tell them kindly
    to retake or explains why it doesn't belong in a waste bin.
  - Tamil → Tanglish (Tamil + English mix, natural spoken style)
  - Hindi → Hinglish (Hindi + English mix, natural spoken style)
  - English → Clear, friendly, natural spoken British-Indian English
  - Other Indian languages → natural spoken style, not formal/literary

Mode 2 — type="chat"
  Conversational follow-up. Same language/style rules apply.
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

GROQ_KEY   = os.environ.get("GROQ_API_KEY",   "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL",     "qwen/qwen3.8-27b")
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_KEY   = os.environ.get("GEMINI_API_KEY",   "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL",     "gemini-3.5-flash-lite")

UA = "WasteSorterApp/2.0"

# Language → style instruction for the LLM
LANG_STYLE = {
    "en-IN": (
        "English",
        "Write in clear, warm, natural British-Indian English. "
        "Like a knowledgeable friend texting you — casual, direct, no jargon. "
        "Use contractions (it's, don't, you'll). Never use passive voice or formal phrasing."
    ),
    "hi-IN": (
        "Hindi",
        "Hinglish mein likho — yani Hindi aur English ka natural mix, "
        "jaise hum WhatsApp pe baat karte hain. "
        "Example: 'Yeh plastic bottle hai, isse recycle bin mein daalo. Cap on rakhna theek hai!' "
        "Formal/literary Hindi bilkul mat use karo. Aam bolchal ki bhasha use karo."
    ),
    "ta-IN": (
        "Tamil",
        "Tanglish use panunga — Tamil aur English mix, natural-a pesuvadhu mathiri. "
        "Example: 'Ithu plastic bottle, recycle bin-la podunga. Cap remove pannanum nu nenaikkaadheega!' "
        "Formal Tamil use pannaadheenga. Normal-a pesuvathu mathiri ezhudhunga."
    ),
    "te-IN": (
        "Telugu",
        "Natural spoken Telugu use cheyyandi — formal/literary Telugu avoid cheyyandi. "
        "Friendly ga, direct ga, ee item gurinchi mee friend cheppinatu cheyyandi."
    ),
    "kn-IN": (
        "Kannada",
        "Natural spoken Kannada use maadi — formal/literary Kannada avoid maadi. "
        "Friendly aagi, direct aagi, nimage friend heluvante heliri."
    ),
    "ml-IN": (
        "Malayalam",
        "Natural spoken Malayalam use cheyyuka — formal/literary Malayalam avoid cheyyuka. "
        "Friendly ayi, direct ayi, ninakku oru kootukaran parayunna pole ezhuthuka."
    ),
    "mr-IN": (
        "Marathi",
        "Natural spoken Marathi use kara — formal/literary Marathi avoid kara. "
        "Mitra sarkhe bolnyasarkhe lihaa, direct ani friendly."
    ),
    "gu-IN": (
        "Gujarati",
        "Natural spoken Gujarati use karo — formal/literary Gujarati avoid karo. "
        "Mitra ne kahi ne jeva bolava jevo likho, direct ane friendly."
    ),
    "bn-IN": (
        "Bengali",
        "Natural spoken Bengali use koro — formal/literary Bengali avoid koro. "
        "Bondhur moto bolte bolte likho, direct ebong friendly."
    ),
    "pa-IN": (
        "Punjabi",
        "Natural spoken Punjabi use karo — formal/literary Punjabi avoid karo. "
        "Yaar naal gallan karda hova likhna, direct te friendly."
    ),
    "od-IN": (
        "Odia",
        "Natural spoken Odia use kara — formal/literary Odia avoid kara. "
        "Bondhu sathire kathaa kahibaa pare lekha, direct ebam friendly."
    ),
}


def _sys_analyze(label, category, bin_type, conf, lang_code, is_waste):
    lang_name, style_note = LANG_STYLE.get(lang_code, LANG_STYLE["en-IN"])

    # Non-waste or human: different response
    if not is_waste or category in ("person", "human", "animal", "food_active"):
        non_waste_note = (
            f"IMPORTANT: This item ('{label}') is NOT waste or is NOT something that belongs in a bin. "
            f"Tell the user warmly that this doesn't look like waste — maybe they scanned the wrong thing, "
            f"or the camera picked up something unexpected. Ask them to retake the photo with just the waste item. "
            f"Keep is_waste as false. Give 0 steps (empty array). "
            f"Make image_desc describe what you think was actually scanned."
        )
    else:
        non_waste_note = ""

    # Decide how many steps based on item complexity
    step_guidance = (
        "Give ONLY 2 steps if disposal is simple (e.g. paper, cardboard, food waste). "
        "Give 3 steps for moderate items (plastic, glass, clothes). "
        "Give 4 steps ONLY for complex/hazardous items (batteries, electronics, e-waste). "
        "Do NOT pad with obvious filler steps."
    )

    return (
        f"You are a real person — a helpful, slightly witty neighbour in India who actually knows "
        f"their waste sorting. {non_waste_note}\n\n"
        f"The user photographed: '{label}' (category: '{category}', bin: '{bin_type}', confidence: {conf:.0%}).\n\n"
        f"LANGUAGE & STYLE: {style_note}\n\n"
        f"VOICE TONE: Write as if this will be READ ALOUD by a voice assistant. "
        f"Short sentences. Natural pauses (use commas). "
        f"Emotional where appropriate — reassuring for hazardous, matter-of-fact for simple items, "
        f"slightly urgent for batteries/electronics. "
        f"NO bullet points, NO bold/italic, NO markdown. JUST natural spoken language.\n\n"
        f"{step_guidance}\n\n"
        "Reply ONLY as a valid JSON object — no markdown, no code fences:\n"
        '{"image_desc":"One warm, natural sentence describing what this item is — like you are seeing it",'
        '"is_waste":true,'
        '"waste_verdict":"One sentence: exactly which bin and why — make it stick in memory",'
        '"steps":["step one text","step two text"],'
        '"hazard_note":"One urgent, specific warning if hazardous — JSON null if safe",'
        '"quick_tip":"One memorable line under 12 words that they will actually remember"}\n\n'
        f"ALL text must be in the {lang_name} style described above. "
        f"Steps must address the most common MISTAKE people make with this specific item."
    )


def _sys_chat(label, category, bin_type, conf, lang_code):
    lang_name, style_note = LANG_STYLE.get(lang_code, LANG_STYLE["en-IN"])
    return (
        f"You are a helpful neighbour answering a waste-sorting question about a '{label}' "
        f"(category: '{category}', bin: '{bin_type}').\n"
        f"Answer like you're replying to a WhatsApp message — short, direct, friendly, honest.\n"
        f"LANGUAGE & STYLE: {style_note}\n"
        f"Keep it to 2 sentences MAX. No lists, no markdown."
    )


def _post(url, body_dict, extra_hdrs):
    data = json.dumps(body_dict, ensure_ascii=False).encode()
    req  = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json", "User-Agent": UA, **extra_hdrs},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def _groq(sys_text, messages, max_tokens=900, temp=0.4, json_mode=False):
    body = {
        "model":       GROQ_MODEL,
        "messages":    [{"role": "system", "content": sys_text}] + messages,
        "max_tokens":  max_tokens,
        "temperature": temp,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    out = _post(GROQ_URL, body, {"Authorization": f"Bearer {GROQ_KEY}"})
    return out["choices"][0]["message"]["content"].strip()


def _gemini(sys_text, messages, max_tokens=900, temp=0.4):
    def _r(r): return "model" if r == "assistant" else r
    contents = [{"role": _r(m["role"]), "parts": [{"text": m["content"]}]} for m in messages]
    body = {
        "system_instruction": {"parts": [{"text": sys_text}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temp},
    }
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}")
    out  = _post(url, body, {})
    text = out["candidates"][0]["content"]["parts"][0]["text"].strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text  = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()
    return text


def _llm(sys_text, messages, max_tokens=900, temp=0.4, json_mode=False):
    if GROQ_KEY:
        try:
            return _groq(sys_text, messages, max_tokens, temp, json_mode), "groq"
        except Exception:
            pass
    if GEMINI_KEY:
        try:
            return _gemini(sys_text, messages, max_tokens, temp), "gemini"
        except Exception:
            pass
    raise RuntimeError("No LLM available.")


def do_analyze(label, category, bin_type, conf, lang, is_waste):
    sys_text  = _sys_analyze(label, category, bin_type, conf, lang, is_waste)
    msgs      = [{"role": "user", "content": f"Analyze '{label}' now."}]
    raw, prov = _llm(sys_text, msgs, max_tokens=900, temp=0.4, json_mode=True)
    parsed    = json.loads(raw)
    steps = parsed.get("steps")
    if not isinstance(steps, list): steps = []
    parsed["steps"]    = steps[:4]
    parsed["type"]     = "analyze"
    parsed["provider"] = prov
    return parsed


def do_chat(label, category, bin_type, conf, lang, messages):
    sys_text  = _sys_chat(label, category, bin_type, conf, lang)
    history   = [m for m in messages
                 if m.get("role") in ("user", "assistant") and m.get("content")]
    if not history:
        history = [{"role": "user", "content": "Quick summary please."}]
    text, prov = _llm(sys_text, history[-8:], max_tokens=350, temp=0.5)
    return {"type": "chat", "text": text, "lang": lang, "provider": prov}


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
            d = json.loads(self.rfile.read(n) or b"{}")
            label    = d.get("label") or d.get("class") or "unknown item"
            category = d.get("category") or label
            bin_type = d.get("bin", "landfill")
            conf     = float(d.get("confidence", 0))
            lang     = d.get("lang", "en-IN")
            is_waste = d.get("is_waste", True)

            if not GROQ_KEY and not GEMINI_KEY:
                return self._send(503, {"error": "No LLM API keys set.", "disabled": True})

            if d.get("type") == "chat":
                result = do_chat(label, category, bin_type, conf, lang,
                                 d.get("messages", []))
            else:
                try:
                    result = do_analyze(label, category, bin_type, conf, lang, is_waste)
                except (json.JSONDecodeError, KeyError):
                    result = do_chat(label, category, bin_type, conf, lang, [])
                    result["type"] = "analyze_fallback"
            self._send(200, result)
        except urllib.error.HTTPError as e:
            self._send(502, {"error": f"API error {e.code}: {e.read().decode()[:200]}"})
        except Exception as e:
            self._send(500, {"error": f"Chat failed: {e}"})

    def log_message(self, *_):
        pass
