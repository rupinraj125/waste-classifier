const post = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const classify = (image) => post('/api/classify', { image })

export const analyze = (label, category, bin, confidence, isWaste, lang) =>
  post('/api/chat', {
    type: 'analyze',
    label,
    category,
    bin,
    confidence,
    is_waste: isWaste,
    lang,
  })

export const chat = (label, category, bin, confidence, lang, messages) =>
  post('/api/chat', {
    type: 'chat',
    label,
    category,
    bin,
    confidence,
    lang,
    messages,
  })

export const tts = (text, languageCode, speaker, full = false, pace = 1.05) =>
  post('/api/tts', { text, language_code: languageCode, speaker, full, pace })

export const retranslate = (label, category, bin, confidence, isWaste, lang) =>
  post('/api/chat', {
    type: 'analyze',
    label,
    category,
    bin,
    confidence,
    is_waste: isWaste,
    lang,
  })
