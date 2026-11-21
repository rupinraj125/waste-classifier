import { useState, useRef, useCallback } from 'react'
import { VOICES, LANGUAGES, TTS_SPEEDS, CITIES } from './constants.js'

const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def } },
  set: (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

export function useStore() {
  // image
  const [img64, setImg64]     = useState(null)
  const [clsData, setClsData] = useState(null)
  const [anaData, setAnaData] = useState(null)
  const [history, setHistory] = useState([])
  const [phase, setPhase]     = useState('idle')
  const [error, setError]     = useState('')

  // persistent settings
  const [voice, setVoiceRaw]    = useState(() => VOICES.find(v => v.id === LS.get('voice', 'shubh')) || VOICES[0])
  const [lang, setLangRaw]      = useState(() => LANGUAGES.find(l => l.code === LS.get('lang', 'en-IN')) || LANGUAGES[0])
  const [ttsSpeed, setSpeedRaw] = useState(() => TTS_SPEEDS.find(s => s.id === LS.get('ttsSpeed', 'normal')) || TTS_SPEEDS[1])
  const [city, setCityRaw]      = useState(() => CITIES.find(c => c.id === LS.get('city', 'other')) || CITIES[CITIES.length - 1])

  const setVoice = useCallback((v) => { setVoiceRaw(v); LS.set('voice', v.id) }, [])
  const setLang  = useCallback((l) => { setLangRaw(l);  LS.set('lang',  l.code) }, [])
  const setSpeed = useCallback((s) => { setSpeedRaw(s); LS.set('ttsSpeed', s.id) }, [])
  const setCity  = useCallback((c) => { setCityRaw(c);  LS.set('city',  c.id) }, [])

  // settings drawer
  const [settingsOpen, setSettingsOpen] = useState(false)

  // TTS
  const [speaking, setSpeaking] = useState(false)
  const audRef  = useRef(new Audio())
  const stopRef = useRef(false)

  // scan history (session + localStorage, max 20)
  const [scanLog, setScanLog] = useState(() => LS.get('scanLog', []))

  const addScan = useCallback((entry) => {
    // Downscale thumbnail to 64px before storing — prevents localStorage quota issues
    const thumb = entry.img64
      ? (() => {
          try {
            const img = new Image()
            img.src = entry.img64
            const cv = document.createElement('canvas')
            const s = Math.min(1, 64 / Math.max(img.naturalWidth || 64, img.naturalHeight || 64))
            cv.width  = Math.round((img.naturalWidth  || 64) * s)
            cv.height = Math.round((img.naturalHeight || 64) * s)
            cv.getContext('2d')?.drawImage(img, 0, 0, cv.width, cv.height)
            return cv.toDataURL('image/jpeg', 0.5)
          } catch { return null }
        })()
      : null
    setScanLog(prev => {
      const updated = [{ ...entry, img64: thumb }, ...prev].slice(0, 20)
      LS.set('scanLog', updated)
      return updated
    })
  }, [])

  const clearLog = useCallback(() => {
    setScanLog([])
    LS.set('scanLog', [])
  }, [])

  // streak & points
  const [points, setPoints]   = useState(() => LS.get('points', 0))
  const [streak, setStreak]   = useState(() => LS.get('streak', 0))
  const [lastScan, setLastScan] = useState(() => LS.get('lastScan', null))

  const awardPoints = useCallback((binType) => {
    const pts = { hazardous: 25, compost: 15, recycle: 10, landfill: 5 }
    const earned = pts[binType] || 5
    setPoints(p => { const n = p + earned; LS.set('points', n); return n })

    // streak: increment if last scan was today or yesterday
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    setLastScan(prev => {
      if (prev === today) {
        // already scanned today, no streak change
      } else if (prev === yesterday) {
        setStreak(s => { const n = s + 1; LS.set('streak', n); return n })
      } else {
        setStreak(1); LS.set('streak', 1)
      }
      LS.set('lastScan', today)
      return today
    })
    return earned
  }, [])

  // session usage counters
  const [usage, setUsage] = useState({ classifyCalls: 0, chatCalls: 0, ttsCalls: 0, totalChars: 0 })

  const bumpUsage = useCallback((type, chars = 0) => {
    setUsage(u => ({
      ...u,
      classifyCalls: u.classifyCalls + (type === 'classify' ? 1 : 0),
      chatCalls:     u.chatCalls     + (type === 'chat'     ? 1 : 0),
      ttsCalls:      u.ttsCalls      + (type === 'tts'      ? 1 : 0),
      totalChars:    u.totalChars    + chars,
    }))
  }, [])

  // TTS helpers
  const stopSpeaking = useCallback(() => {
    stopRef.current = true
    audRef.current.pause()
    audRef.current.src = ''
    setSpeaking(false)
  }, [])

  const reset = useCallback(() => {
    stopSpeaking()
    setImg64(null)
    setClsData(null)
    setAnaData(null)
    setHistory([])
    setPhase('idle')
    setError('')
  }, [stopSpeaking])

  return {
    img64, setImg64,
    clsData, setClsData,
    anaData, setAnaData,
    history, setHistory,
    phase, setPhase,
    error, setError,
    voice, setVoice,
    lang, setLang,
    ttsSpeed, setSpeed,
    city, setCity,
    settingsOpen, setSettingsOpen,
    speaking, setSpeaking,
    audRef, stopRef,
    usage, bumpUsage,
    scanLog, addScan, clearLog,
    points, streak,
    awardPoints,
    stopSpeaking,
    reset,
  }
}
