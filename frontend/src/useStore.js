import { useState, useRef, useCallback } from 'react'
import { VOICES, LANGUAGES } from './constants.js'

export function useStore() {
  // image
  const [img64, setImg64] = useState(null)

  // classify result
  const [clsData, setClsData] = useState(null)

  // analyze result
  const [anaData, setAnaData] = useState(null)

  // chat history
  const [history, setHistory] = useState([])

  // UI state
  const [phase, setPhase] = useState('idle') // idle | loaded | classifying | analysing | result
  const [error, setError] = useState('')

  // settings
  const [voice, setVoice] = useState(VOICES[0])
  const [lang, setLang] = useState(LANGUAGES[0])
  const [settingsOpen, setSettingsOpen] = useState(false)

  // TTS state
  const [speaking, setSpeaking] = useState(false)
  const audRef = useRef(new Audio())
  const stopRef = useRef(false)

  // usage counters (session-level)
  const [usage, setUsage] = useState({
    classifyCalls: 0,
    chatCalls: 0,
    ttsCalls: 0,
    totalChars: 0,
  })

  const bumpUsage = useCallback((type, chars = 0) => {
    setUsage(u => ({
      ...u,
      classifyCalls: u.classifyCalls + (type === 'classify' ? 1 : 0),
      chatCalls:     u.chatCalls     + (type === 'chat'     ? 1 : 0),
      ttsCalls:      u.ttsCalls      + (type === 'tts'      ? 1 : 0),
      totalChars:    u.totalChars    + chars,
    }))
  }, [])

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
    settingsOpen, setSettingsOpen,
    speaking, setSpeaking,
    audRef, stopRef,
    usage, bumpUsage,
    stopSpeaking,
    reset,
  }
}
