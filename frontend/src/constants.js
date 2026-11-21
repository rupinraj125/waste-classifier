export const BIN_INFO = {
  recycle:   { color: '#4f8ef7', glow: 'rgba(79,142,247,.22)',  soft: 'rgba(79,142,247,.1)',  label: 'Recycling Bin',          emoji: '♻️' },
  compost:   { color: '#d97706', glow: 'rgba(217,119,6,.22)',   soft: 'rgba(217,119,6,.1)',   label: 'Compost / Wet Waste',     emoji: '🟤' },
  hazardous: { color: '#ef4444', glow: 'rgba(239,68,68,.22)',   soft: 'rgba(239,68,68,.1)',   label: 'Hazardous — Special Drop-off', emoji: '⚠️' },
  landfill:  { color: '#64748b', glow: 'rgba(100,116,139,.22)', soft: 'rgba(100,116,139,.1)', label: 'General Waste',           emoji: '🗑️' },
}

export const VOICES = [
  { id: 'shubh',  name: 'Shubh',  gender: 'Male',   emoji: '👨', desc: 'Warm & clear' },
  { id: 'aditya', name: 'Aditya', gender: 'Male',   emoji: '👦', desc: 'Young & energetic' },
  { id: 'ishita', name: 'Ishita', gender: 'Female', emoji: '👩', desc: 'Friendly & bright' },
  { id: 'priya',  name: 'Priya',  gender: 'Female', emoji: '👧', desc: 'Soft & expressive' },
]

export const LANGUAGES = [
  { code: 'en-IN', label: 'English',    short: 'EN' },
  { code: 'hi-IN', label: 'हिन्दी',     short: 'HI' },
  { code: 'ta-IN', label: 'தமிழ்',      short: 'TA' },
  { code: 'te-IN', label: 'తెలుగు',     short: 'TE' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ',      short: 'KN' },
  { code: 'ml-IN', label: 'മലയാളം',     short: 'ML' },
  { code: 'mr-IN', label: 'मराठी',      short: 'MR' },
  { code: 'gu-IN', label: 'ગુજરાતી',    short: 'GU' },
  { code: 'bn-IN', label: 'বাংলা',      short: 'BN' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ',     short: 'PA' },
  { code: 'od-IN', label: 'ଓଡ଼ିଆ',      short: 'OD' },
]

export const PROV_LABEL = {
  groq:    '⚡ Groq',
  gemini:  '✦ Gemini',
  offline: 'Offline',
}
