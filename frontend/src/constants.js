export const BIN_INFO = {
  recycle:   { color: '#4f8ef7', glow: 'rgba(79,142,247,.22)',  soft: 'rgba(79,142,247,.1)',  label: 'Recycling Bin',               emoji: '♻️' },
  compost:   { color: '#d97706', glow: 'rgba(217,119,6,.22)',   soft: 'rgba(217,119,6,.1)',   label: 'Compost / Wet Waste',          emoji: '🟤' },
  hazardous: { color: '#ef4444', glow: 'rgba(239,68,68,.22)',   soft: 'rgba(239,68,68,.1)',   label: 'Hazardous — Special Drop-off', emoji: '⚠️' },
  landfill:  { color: '#64748b', glow: 'rgba(100,116,139,.22)', soft: 'rgba(100,116,139,.1)', label: 'General Waste',                emoji: '🗑️' },
}

export const VOICES = [
  // ── Male ──────────────────────────────────────────────────────
  { id: 'shubh',    name: 'Shubh',    gender: 'Male',   tone: 'Warm & clear',       emoji: '👨' },
  { id: 'aditya',   name: 'Aditya',   gender: 'Male',   tone: 'Young & energetic',  emoji: '👦' },
  { id: 'advait',   name: 'Advait',   gender: 'Male',   tone: 'Deep & steady',      emoji: '🧑' },
  { id: 'anand',    name: 'Anand',    gender: 'Male',   tone: 'Friendly & bright',  emoji: '😊' },
  { id: 'rahul',    name: 'Rahul',    gender: 'Male',   tone: 'Casual & natural',   emoji: '🙂' },
  { id: 'rohan',    name: 'Rohan',    gender: 'Male',   tone: 'Smooth & confident', emoji: '😎' },
  { id: 'amit',     name: 'Amit',     gender: 'Male',   tone: 'Bold & clear',       emoji: '💪' },
  { id: 'dev',      name: 'Dev',      gender: 'Male',   tone: 'Crisp & modern',     emoji: '⚡' },
  { id: 'kabir',    name: 'Kabir',    gender: 'Male',   tone: 'Rich & warm',        emoji: '🎙️' },
  { id: 'mani',     name: 'Mani',     gender: 'Male',   tone: 'Relaxed & friendly', emoji: '🌿' },
  { id: 'gokul',    name: 'Gokul',    gender: 'Male',   tone: 'Cheerful & clear',   emoji: '☀️' },
  { id: 'tarun',    name: 'Tarun',    gender: 'Male',   tone: 'Youthful & sharp',   emoji: '🔥' },
  { id: 'sunny',    name: 'Sunny',    gender: 'Male',   tone: 'Bright & upbeat',    emoji: '🌞' },
  { id: 'soham',    name: 'Soham',    gender: 'Male',   tone: 'Calm & measured',    emoji: '🧘' },
  { id: 'rehan',    name: 'Rehan',    gender: 'Male',   tone: 'Smooth & expressive',emoji: '🎤' },
  { id: 'mohit',    name: 'Mohit',    gender: 'Male',   tone: 'Strong & steady',    emoji: '🏋️' },
  { id: 'varun',    name: 'Varun',    gender: 'Male',   tone: 'Easy-going & warm',  emoji: '🌊' },
  { id: 'manan',    name: 'Manan',    gender: 'Male',   tone: 'Thoughtful & clear', emoji: '💭' },
  { id: 'sumit',    name: 'Sumit',    gender: 'Male',   tone: 'Authoritative',      emoji: '📢' },
  { id: 'aayan',    name: 'Aayan',    gender: 'Male',   tone: 'Lively & fresh',     emoji: '🌱' },
  { id: 'ashutosh', name: 'Ashutosh', gender: 'Male',   tone: 'Professional & clear',emoji: '🎯' },
  { id: 'ratan',    name: 'Ratan',    gender: 'Male',   tone: 'Mature & trustworthy',emoji: '🏅' },
  { id: 'vijay',    name: 'Vijay',    gender: 'Male',   tone: 'Bold & confident',   emoji: '🏆' },
  // ── Female ────────────────────────────────────────────────────
  { id: 'ishita',   name: 'Ishita',   gender: 'Female', tone: 'Friendly & bright',  emoji: '👩' },
  { id: 'priya',    name: 'Priya',    gender: 'Female', tone: 'Soft & expressive',  emoji: '👧' },
  { id: 'neha',     name: 'Neha',     gender: 'Female', tone: 'Sweet & clear',      emoji: '🌸' },
  { id: 'pooja',    name: 'Pooja',    gender: 'Female', tone: 'Warm & soothing',    emoji: '🌺' },
  { id: 'simran',   name: 'Simran',   gender: 'Female', tone: 'Natural & calm',     emoji: '🌼' },
  { id: 'kavya',    name: 'Kavya',    gender: 'Female', tone: 'Lively & cheerful',  emoji: '✨' },
  { id: 'shreya',   name: 'Shreya',   gender: 'Female', tone: 'Clear & confident',  emoji: '💫' },
  { id: 'roopa',    name: 'Roopa',    gender: 'Female', tone: 'Warm & motherly',    emoji: '🤗' },
  { id: 'tanya',    name: 'Tanya',    gender: 'Female', tone: 'Crisp & modern',     emoji: '⚡' },
  { id: 'shruti',   name: 'Shruti',   gender: 'Female', tone: 'Melodic & gentle',   emoji: '🎵' },
  { id: 'suhani',   name: 'Suhani',   gender: 'Female', tone: 'Pleasant & smooth',  emoji: '🌙' },
  { id: 'kavitha',  name: 'Kavitha',  gender: 'Female', tone: 'Deep & expressive',  emoji: '🎭' },
  { id: 'rupali',   name: 'Rupali',   gender: 'Female', tone: 'Rich & warm',        emoji: '🌹' },
  { id: 'ritu',     name: 'Ritu',     gender: 'Female', tone: 'Bright & upbeat',    emoji: '🌟' },
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

// Voice preview phrases — unique per language, native script, 6-10 words
// Different sentence for each language so the preview sounds natural
export const VOICE_PREVIEWS = {
  'en-IN': "Separate your dry and wet waste before putting them in the bin.",
  'hi-IN': "कचरे को सही तरीके से अलग करें और पर्यावरण बचाएं।",
  'ta-IN': "உங்கள் குப்பையை சரியாக பிரித்து சுற்றுச்சூழலை காப்போம்.",
  'te-IN': "మీ వ్యర్థాలను సరిగ్గా వేరు చేసి పర్యావరణాన్ని కాపాడండి.",
  'kn-IN': "ನಿಮ್ಮ ತ್ಯಾಜ್ಯವನ್ನು ಸರಿಯಾಗಿ ಬೇರ್ಪಡಿಸಿ ಪರಿಸರ ಉಳಿಸಿ.",
  'ml-IN': "നിങ്ങളുടെ മാലിന്യം ശരിയായി വേർതിരിച്ച് പരിസ്ഥിതി സംരക്ഷിക്കൂ.",
  'mr-IN': "कचरा योग्य पद्धतीने वेगळा करा आणि पर्यावरण वाचवा.",
  'gu-IN': "કચરો યોગ્ય રીતે અલગ કરો અને પર્યાવરણ બચાવો.",
  'bn-IN': "আপনার বর্জ্য সঠিকভাবে আলাদা করুন এবং পরিবেশ রক্ষা করুন।",
  'pa-IN': "ਆਪਣਾ ਕੂੜਾ ਸਹੀ ਤਰੀਕੇ ਨਾਲ ਵੱਖ ਕਰੋ ਅਤੇ ਵਾਤਾਵਰਣ ਬਚਾਓ।",
  'od-IN': "ଆପଣଙ୍କ ଆବର୍ଜନାକୁ ସଠିକ ଭାବରେ ଅଲଗା କରନ୍ତୁ।",
}

export const TTS_SPEEDS = [
  { id: 'slow',   label: 'Slow',   pace: 0.8 },
  { id: 'normal', label: 'Normal', pace: 1.0 },
  { id: 'fast',   label: 'Fast',   pace: 1.2 },
]

export const PROV_LABEL = {
  groq:    '⚡ Groq',
  gemini:  '✦ Gemini',
  offline: 'Offline',
}

export const RECYCLABILITY = {
  plastic:     { score: 70, label: 'Mostly Recyclable',       color: '#4f8ef7', note: 'Clean plastics (1, 2, 5) are recycled. Greasy or mixed plastics usually end up in landfill.' },
  glass:       { score: 95, label: 'Highly Recyclable',       color: '#22c55e', note: 'Glass can be recycled endlessly without losing quality.' },
  metal:       { score: 90, label: 'Highly Recyclable',       color: '#22c55e', note: 'Metals like aluminium and steel are recycled very efficiently in India.' },
  cardboard:   { score: 85, label: 'Highly Recyclable',       color: '#22c55e', note: 'Clean, dry cardboard is in high demand from paper mills.' },
  paper:       { score: 75, label: 'Mostly Recyclable',       color: '#4f8ef7', note: 'Clean paper recycles well. Wet, greasy, or laminated paper does not.' },
  biological:  { score: 100,label: 'Fully Compostable',       color: '#d97706', note: 'All food scraps can go to compost. Never send to landfill if you can avoid it.' },
  vegetation:  { score: 100,label: 'Fully Compostable',       color: '#d97706', note: 'Garden waste is perfect for composting or green bin collection.' },
  battery:     { score: 40, label: 'Conditionally Recyclable',color: '#f97316', note: 'Batteries must go to certified e-waste centres. Never bin them — they cause fires.' },
  electronics: { score: 35, label: 'Conditionally Recyclable',color: '#f97316', note: 'E-waste has recoverable metals but needs authorized recyclers to do it safely.' },
  clothes:     { score: 55, label: 'Partially Recyclable',    color: '#8b5cf6', note: 'Wearable clothes can be donated. Worn-out textiles go to textile recyclers.' },
  shoes:       { score: 45, label: 'Partially Recyclable',    color: '#8b5cf6', note: 'Rubber soles can be recycled. Many shoe brands have take-back programmes.' },
  trash:       { score: 10, label: 'Mostly Landfill',         color: '#64748b', note: 'Most general trash ends up in landfill. Try to avoid producing this category.' },
  other:       { score: 20, label: 'Mostly Landfill',         color: '#64748b', note: 'Check if anything can be separated out before sending to landfill.' },
}

export const CO2_STATS = {
  plastic:     { saved: 84,   unit: 'g CO₂',   equiv: 'charging your phone twice' },
  glass:       { saved: 315,  unit: 'g CO₂',   equiv: 'driving 2 km on a bike' },
  metal:       { saved: 900,  unit: 'g CO₂',   equiv: 'running a fan for 5 hours' },
  cardboard:   { saved: 170,  unit: 'g CO₂',   equiv: 'one hour of TV' },
  paper:       { saved: 60,   unit: 'g CO₂',   equiv: 'a 10-minute hot shower' },
  biological:  { saved: 220,  unit: 'g CO₂',   equiv: 'skipping one meat meal' },
  vegetation:  { saved: 180,  unit: 'g CO₂',   equiv: 'two hours of LED lighting' },
  battery:     { saved: 1200, unit: 'g CO₂',   equiv: 'driving 8 km in a car' },
  electronics: { saved: 4000, unit: 'g CO₂',   equiv: 'a week of internet usage' },
  clothes:     { saved: 1500, unit: 'g CO₂',   equiv: 'running AC for 2 hours' },
  shoes:       { saved: 800,  unit: 'g CO₂',   equiv: 'a 45-min washing machine cycle' },
  trash:       { saved: 0,    unit: 'g CO₂',   equiv: 'nothing — this goes to landfill' },
}

export const DID_YOU_KNOW = {
  plastic: [
    'India generates 9.4 million tonnes of plastic waste per year — but only 60% gets recycled.',
    'A single plastic bag takes up to 1,000 years to decompose in a landfill.',
    'Recycling one tonne of plastic saves 5,774 kWh of energy — enough to power a home for 6 months.',
  ],
  glass: [
    'Glass is 100% recyclable and can be recycled endlessly without losing purity or quality.',
    'Recycled glass melts at a lower temperature than raw materials, saving significant energy.',
    'The glass you recycle today could be back on a shelf as a new bottle in just 30 days.',
  ],
  metal: [
    'Aluminium can be recycled indefinitely — the same atoms, just melted and reshaped.',
    'Recycling aluminium uses only 5% of the energy needed to produce new aluminium from ore.',
    'Steel is the most recycled material on earth — over 80% of steel in circulation is recycled.',
  ],
  cardboard: [
    'One tonne of recycled cardboard saves 17 trees and 7,000 litres of water.',
    'Most Indian kirana stores and offices generate enough cardboard for profitable recycling.',
    'Wet or greasy cardboard cannot be recycled — always keep it dry.',
  ],
  paper: [
    'The average Indian office worker uses about 10,000 sheets of paper per year.',
    'Recycling one tonne of paper saves 17 trees, 26,000 litres of water and 4,000 kWh of energy.',
    'Paper can only be recycled 5–7 times before the fibres become too short to use.',
  ],
  biological: [
    'Food waste in Indian landfills produces methane — a greenhouse gas 25x more potent than CO₂.',
    'Composting your kitchen waste can reduce your household carbon footprint by up to 10%.',
    'India wastes 67 million tonnes of food annually — the largest source of avoidable emissions.',
  ],
  battery: [
    'One AA battery can contaminate 400 litres of groundwater if improperly disposed.',
    'Battery fires in waste trucks are increasing — lithium batteries cause 65% of recycling facility fires.',
    'India generates 500,000 tonnes of e-waste per year, much of it from batteries.',
  ],
  electronics: [
    'A single smartphone contains over 60 different elements, including gold, silver, and rare earth metals.',
    'Only 20% of global e-waste is formally recycled — the rest ends up in landfills or informal sectors.',
    'Recovering gold from e-waste yields 10x more gold per tonne than from a gold mine.',
  ],
  clothes: [
    'The fashion industry is responsible for 10% of global carbon emissions — more than aviation and shipping combined.',
    'It takes 2,700 litres of water to make one cotton T-shirt — the same amount one person drinks in 2.5 years.',
    'India is the world\'s second largest textile producer, and textile waste is a growing crisis.',
  ],
  vegetation: [
    'Garden waste is rich in nitrogen and carbon — perfect ingredients for compost.',
    'Composting garden waste instead of landfilling it reduces methane emissions significantly.',
    'A healthy compost pile can turn garden waste into usable soil amendment in 2–3 months.',
  ],
  trash: [
    'General waste in landfills produces leachate — a toxic liquid that can contaminate groundwater.',
    'Indian landfills are overflowing — Mumbai\'s Deonar dump is as tall as a 17-storey building.',
    'Before sending something to general waste, ask: can any part of this be separated for recycling?',
  ],
}

export const CITIES = [
  { id: 'mumbai',    name: 'Mumbai',    state: 'Maharashtra', dryDay: 'Monday & Thursday',    wetDay: 'Daily',       authority: 'BMC',   hotline: '1916' },
  { id: 'delhi',     name: 'Delhi',     state: 'Delhi',       dryDay: 'Wednesday & Saturday', wetDay: 'Daily',       authority: 'MCD',   hotline: '1800-11-0083' },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka',   dryDay: 'Tuesday & Friday',     wetDay: 'Daily',       authority: 'BBMP',  hotline: '1533' },
  { id: 'chennai',   name: 'Chennai',   state: 'Tamil Nadu',  dryDay: 'Tuesday',              wetDay: 'Daily',       authority: 'GCC',   hotline: '044-25384583' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana',   dryDay: 'Monday & Thursday',    wetDay: 'Daily',       authority: 'GHMC',  hotline: '040-21111111' },
  { id: 'kolkata',   name: 'Kolkata',   state: 'West Bengal', dryDay: 'Wednesday',            wetDay: 'Daily',       authority: 'KMC',   hotline: '033-22861212' },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat',     dryDay: 'Thursday',             wetDay: 'Daily',       authority: 'AMC',   hotline: '079-25391800' },
  { id: 'pune',      name: 'Pune',      state: 'Maharashtra', dryDay: 'Monday & Friday',      wetDay: 'Daily',       authority: 'PMC',   hotline: '020-25506800' },
  { id: 'kochi',     name: 'Kochi',     state: 'Kerala',      dryDay: 'Saturday',             wetDay: 'Daily',       authority: 'KCorp', hotline: '0484-2334017' },
  { id: 'other',     name: 'Other city',state: '',            dryDay: 'Check locally',         wetDay: 'Check locally', authority: 'Local ULB', hotline: 'Visit your municipal office' },
]
