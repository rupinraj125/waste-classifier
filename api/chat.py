"""
POST /api/chat — Groq primary, Gemini fallback.

Mode 1 — type="analyze"
  Returns JSON with ALL strings in the chosen language.
  - Pure native language for every output (no mixing, no Tanglish, no Hinglish)
  - Conversational and warm — like a helpful friend, NOT a textbook
  - Non-waste / human: kindly redirect, 0 steps
  - Variable steps: 2 for simple items, 3 for moderate, 4 for hazardous only

Mode 2 — type="chat"
  Conversational follow-up in pure native language.
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

GROQ_KEY   = os.environ.get("GROQ_API_KEY",   "").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL",     "qwen/qwen3.8-27b")
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_KEY   = os.environ.get("GEMINI_API_KEY",   "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL",     "gemini-3.5-flash-lite")

UA = "WasteSorterApp/2.0"

# Pure native language instructions — no code-mixing
LANG_STYLE = {
    "en-IN": (
        "English",
        "Write in clear, warm, conversational Indian English. "
        "Like a knowledgeable friend — casual, direct, helpful. "
        "Use contractions (it's, don't, you'll). Short sentences. "
        "No jargon, no passive voice, no textbook language."
    ),
    "hi-IN": (
        "Hindi",
        "शुद्ध हिंदी में लिखें — सरल, बोलचाल की भाषा में। "
        "जैसे कोई जानकार दोस्त सीधे बात कर रहा हो। "
        "छोटे वाक्य रखें। औपचारिक या साहित्यिक हिंदी न लिखें।"
    ),
    "ta-IN": (
        "Tamil",
        "தமிழில் எழுதுங்கள் — எளிய, இயற்கையான பேச்சு வழக்கில். "
        "ஒரு அறிவுள்ள நண்பர் நேரடியாக பேசுவது போல் எழுதுங்கள். "
        "குறுகிய வாக்கியங்கள் பயன்படுத்துங்கள். "
        "ஆங்கில வார்த்தைகள் கலக்காதீர்கள். இலக்கண நடை வேண்டாம்."
    ),
    "te-IN": (
        "Telugu",
        "తెలుగులో రాయండి — సులభమైన, సహజమైన మాట్లాడే శైలిలో. "
        "ఒక నమ్మకమైన స్నేహితుడు నేరుగా చెప్పినట్లు రాయండి. "
        "చిన్న వాక్యాలు వాడండి. ఆంగ్ల మాటలు కలపవద్దు. "
        "పుస్తక భాష వాడవద్దు."
    ),
    "kn-IN": (
        "Kannada",
        "ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ — ಸರಳ, ನೈಸರ್ಗಿಕ ಮಾತನಾಡುವ ಶೈಲಿಯಲ್ಲಿ. "
        "ಒಬ್ಬ ಬುದ್ಧಿವಂತ ಸ್ನೇಹಿತ ನೇರವಾಗಿ ಹೇಳಿದಂತೆ ಬರೆಯಿರಿ. "
        "ಚಿಕ್ಕ ವಾಕ್ಯಗಳನ್ನು ಬಳಸಿ. ಇಂಗ್ಲಿಷ್ ಮಿಶ್ರ ಮಾಡಬೇಡಿ. "
        "ಸಾಹಿತ್ಯಿಕ ಭಾಷೆ ಬಳಸಬೇಡಿ."
    ),
    "ml-IN": (
        "Malayalam",
        "മലയാളത്തിൽ എഴുതുക — ലളിതമായ, സ്വാഭാവിക സംഭാഷണ ഭാഷയിൽ. "
        "ഒരു അറിവുള്ള സുഹൃത്ത് നേരിട്ട് പറയുന്ന പോലെ. "
        "ചെറിയ വാക്യങ്ങൾ ഉപയോഗിക്കുക. "
        "ഇംഗ്ലീഷ് കലർത്തരുത്. ഗ്രന്ഥഭാഷ ഉപയോഗിക്കരുത്."
    ),
    "mr-IN": (
        "Marathi",
        "मराठीत लिहा — सोप्या, बोलीभाषेत. "
        "एखाद्या जाणकार मित्राप्रमाणे थेट बोलल्यासारखे लिहा. "
        "छोटी वाक्ये वापरा. इंग्रजी शब्द मिसळू नका. "
        "औपचारिक किंवा साहित्यिक मराठी वापरू नका."
    ),
    "gu-IN": (
        "Gujarati",
        "ગુજરાતીમાં લખો — સરળ, બોલચાલની ભાષામાં. "
        "એક જ્ઞાની મિત્ર સીધી વાત કરે તે રીતે. "
        "નાના વાક્યો વાપરો. અંગ્રેજી ભળવ ન ​​કરો. "
        "ઔપચારિક ભાષા ન વાપરો."
    ),
    "bn-IN": (
        "Bengali",
        "বাংলায় লিখুন — সহজ, কথ্য ভাষায়। "
        "একজন জ্ঞানী বন্ধু যেভাবে সরাসরি বলে সেভাবে লিখুন। "
        "ছোট বাক্য ব্যবহার করুন। ইংরেজি মেশাবেন না। "
        "আনুষ্ঠানিক বা সাহিত্যিক ভাষা ব্যবহার করবেন না।"
    ),
    "pa-IN": (
        "Punjabi",
        "ਪੰਜਾਬੀ ਵਿੱਚ ਲਿਖੋ — ਸਰਲ, ਬੋਲਚਾਲ ਦੀ ਭਾਸ਼ਾ ਵਿੱਚ। "
        "ਜਿਵੇਂ ਕੋਈ ਜਾਣਕਾਰ ਦੋਸਤ ਸਿੱਧਾ ਗੱਲ ਕਰਦਾ ਹੋਵੇ। "
        "ਛੋਟੇ ਵਾਕ ਵਰਤੋ। ਅੰਗਰੇਜ਼ੀ ਨਾ ਮਿਲਾਓ।"
    ),
    "od-IN": (
        "Odia",
        "ଓଡ଼ିଆରେ ଲେଖନ୍ତୁ — ସରଳ, ବୋଲିଭାଷାରେ। "
        "ଜଣେ ଜ୍ଞାନୀ ବନ୍ଧୁ ସିଧା କଥା କହୁଥିବା ଭଳି ଲେଖନ୍ତୁ। "
        "ଛୋଟ ବାକ୍ୟ ବ୍ୟବହାର କରନ୍ତୁ। ଇଂରାଜୀ ମିଶ୍ରଣ କରନ୍ତୁ ନାହିଁ।"
    ),
}


def _sys_analyze(label, category, bin_type, conf, lang_code, is_waste):
    lang_name, style_note = LANG_STYLE.get(lang_code, LANG_STYLE["en-IN"])

    if not is_waste or category in ("person", "human", "animal", "food_active"):
        non_waste_note = (
            f"IMPORTANT: '{label}' does not appear to be a waste item. "
            "Tell the user warmly that this doesn't look like something to dispose of — "
            "ask them to retake the photo showing only the waste item they want to sort. "
            "Set is_waste to false. Give ZERO steps (empty array []). "
            "Make image_desc describe what was actually seen in a friendly way."
        )
    else:
        non_waste_note = ""

    step_guidance = (
        "Steps count rule — follow strictly:\n"
        "- 2 steps: simple items (paper, cardboard, food scraps, vegetable waste)\n"
        "- 3 steps: moderate items (plastic bottles, glass, clothes, shoes, metal)\n"
        "- 4 steps: hazardous/complex items ONLY (batteries, electronics, e-waste)\n"
        "Do NOT add obvious filler steps. Every step must be a real, specific action."
    )

    return (
        f"You are a helpful, friendly waste-sorting expert for Indian households. {non_waste_note}\n"
        f"The user photographed: '{label}' (category: '{category}', bin: '{bin_type}', confidence: {conf:.0%}).\n\n"
        f"LANGUAGE: {style_note}\n\n"
        "VOICE TONE: This text will be read aloud by a voice assistant. So:\n"
        "- Write short, natural sentences with commas for breathing pauses\n"
        "- Be emotionally appropriate: warm/reassuring for hazardous items, "
        "matter-of-fact for simple ones, slightly serious for batteries/electronics\n"
        "- No bullet points, no markdown, no bold text — only plain spoken sentences\n\n"
        f"{step_guidance}\n\n"
        "Reply ONLY as a valid JSON object — no markdown fences:\n"
        '{"image_desc":"One warm natural sentence describing this exact item",'
        '"is_waste":true,'
        '"waste_verdict":"One sentence: exactly which bin and the most important reason",'
        '"steps":["step one","step two"],'
        '"hazard_note":"One specific urgent warning if hazardous — JSON null if safe",'
        '"quick_tip":"One memorable line under 12 words they will actually use"}\n\n'
        f"ALL output must be in {lang_name}. "
        "Steps must fix the most common mistake people make with this exact item."
    )


def _sys_chat(label, category, bin_type, conf, lang_code):
    lang_name, style_note = LANG_STYLE.get(lang_code, LANG_STYLE["en-IN"])
    return (
        f"You are a friendly waste-sorting helper for Indian households.\n"
        f"Context: the user has '{label}' (category: '{category}', bin: '{bin_type}').\n"
        f"Answer their question directly and helpfully in 2 sentences max.\n"
        f"LANGUAGE: {style_note}\n"
        "No lists, no markdown, no filler."
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
        "contents":           contents,
        "generationConfig":   {"maxOutputTokens": max_tokens, "temperature": temp},
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
    sys_text   = _sys_chat(label, category, bin_type, conf, lang)
    history    = [m for m in messages
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
