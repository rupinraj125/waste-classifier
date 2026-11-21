export const BIN_INFO = {
  recycle:   { color: '#4f8ef7', glow: 'rgba(79,142,247,.22)',  soft: 'rgba(79,142,247,.1)',  label: 'Recycling Bin',               emoji: '♻️' },
  compost:   { color: '#d97706', glow: 'rgba(217,119,6,.22)',   soft: 'rgba(217,119,6,.1)',   label: 'Compost / Wet Waste',          emoji: '🟤' },
  hazardous: { color: '#ef4444', glow: 'rgba(239,68,68,.22)',   soft: 'rgba(239,68,68,.1)',   label: 'Hazardous — Special Drop-off', emoji: '⚠️' },
  landfill:  { color: '#64748b', glow: 'rgba(100,116,139,.22)', soft: 'rgba(100,116,139,.1)', label: 'General Waste',                emoji: '🗑️' },
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

// Voice preview sentences per language per voice — natural, topic-relevant
export const VOICE_PREVIEWS = {
  'en-IN': {
    shubh:  'Please separate your dry and wet waste before putting them in the bin.',
    aditya: 'Did you know recycling one plastic bottle saves enough energy to power a bulb for 3 hours?',
    ishita: 'Sort your waste correctly and help keep our city clean and green.',
    priya:  'Batteries and electronics need special drop-off points — never throw them in a regular bin.',
  },
  'hi-IN': {
    shubh:  'कृपया सूखा और गीला कचरा अलग-अलग डिब्बों में डालें।',
    aditya: 'क्या आप जानते हैं? एक प्लास्टिक बोतल को रिसाइकल करने से तीन घंटे बल्ब जल सकता है।',
    ishita: 'सही तरीके से कचरा छाँटें और अपने शहर को स्वच्छ रखें।',
    priya:  'बैटरी और इलेक्ट्रॉनिक्स को सामान्य कूड़ेदान में कभी न डालें।',
  },
  'ta-IN': {
    shubh:  'உலர் மற்றும் ஈர குப்பைகளை தனித்தனியே பிரித்து போடுங்கள்.',
    aditya: 'ஒரு பிளாஸ்டிக் பாட்டிலை மறுசுழற்சி செய்வது மூன்று மணி நேரம் பல்பை எரிய வைக்கும்.',
    ishita: 'சரியாக குப்பை பிரிக்கவும், நமது நகரை சுத்தமாக வைக்கவும்.',
    priya:  'பேட்டரிகளை சாதாரண குப்பை தொட்டியில் போடாதீர்கள்.',
  },
  'te-IN': {
    shubh:  'పొడి మరియు తడి చెత్తను వేర్వేరు డబ్బాల్లో వేయండి.',
    aditya: 'ఒక ప్లాస్టిక్ బాటిల్ రీసైకిల్ చేయడం వల్ల మూడు గంటలు బల్బు వెలగడం సాధ్యమవుతుంది.',
    ishita: 'సరిగ్గా వ్యర్థాలు విడదీయండి మరియు మీ నగరాన్ని పరిశుభ్రంగా ఉంచండి.',
    priya:  'బ్యాటరీలు సాధారణ చెత్తబుట్టలో వేయవద్దు.',
  },
  'kn-IN': {
    shubh:  'ಒಣ ಮತ್ತು ಹಸಿ ತ್ಯಾಜ್ಯವನ್ನು ಬೇರ್ಪಡಿಸಿ ಹಾಕಿ.',
    aditya: 'ಒಂದು ಪ್ಲಾಸ್ಟಿಕ್ ಬಾಟಲ್ ಮರುಬಳಕೆ ಮಾಡುವುದರಿಂದ ಮೂರು ಗಂಟೆ ಬಲ್ಬ್ ಉರಿಯಬಹುದು.',
    ishita: 'ಸರಿಯಾಗಿ ತ್ಯಾಜ್ಯ ವಿಂಗಡಿಸಿ ನಮ್ಮ ನಗರವನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಇಡಿ.',
    priya:  'ಬ್ಯಾಟರಿಗಳನ್ನು ಸಾಮಾನ್ಯ ಕಸದ ಬುಟ್ಟಿಗೆ ಹಾಕಬೇಡಿ.',
  },
  'ml-IN': {
    shubh:  'ഉണങ്ങിയ, നനഞ്ഞ മാലിന്യങ്ങൾ വേർതിരിച്ച് ഇടുക.',
    aditya: 'ഒരു പ്ലാസ്റ്റിക് ബോട്ടിൽ റീസൈക്കിൾ ചെയ്‌താൽ മൂന്ന് മണിക്കൂർ ബൾബ് കത്തിക്കാം.',
    ishita: 'ശരിയായ രീതിയിൽ മാലിന്യം തരംതിരിച്ച് നഗരം വൃത്തിയാക്കൂ.',
    priya:  'ബാറ്ററികൾ ഒരിക്കലും സാധാരണ ചവറ്റുകുട്ടയിൽ ഇടരുത്.',
  },
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
