import React, { useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BIN_INFO } from './constants.js'
import { classify as apiClassify, analyze as apiAnalyze, chat as apiChat, tts as apiTTS } from './api.js'
import { useStore } from './useStore.js'

import Header         from './components/Header.jsx'
import CameraZone     from './components/CameraZone.jsx'
import Skeleton       from './components/Skeleton.jsx'
import AnalysisCard   from './components/AnalysisCard.jsx'
import ChatCard       from './components/ChatCard.jsx'
import BottomBar      from './components/BottomBar.jsx'
import SettingsDrawer from './components/SettingsDrawer.jsx'
import Footer         from './components/Footer.jsx'

export default function App() {
  const store = useStore()
  const fileRef = useRef(null)
  const [chatLoading, setChatLoading] = React.useState(false)

  const binInfo = store.clsData
    ? (BIN_INFO[store.clsData.bin?.type] || BIN_INFO.landfill)
    : BIN_INFO.recycle
  const acColor = binInfo.color

  // ── Set CSS accent vars ────────────────────────────────
  React.useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--ac', binInfo.color)
    r.style.setProperty('--acl', '#7aadff')
    r.style.setProperty('--acg', binInfo.glow)
    r.style.setProperty('--acs', binInfo.soft)
  }, [binInfo])

  // ── Load image ─────────────────────────────────────────
  const handleFile = useCallback((file) => {
    const url = URL.createObjectURL(file)
    const im  = new Image()
    im.onload = () => {
      const MAX = 640, s = Math.min(1, MAX / Math.max(im.width, im.height))
      const cv = document.createElement('canvas')
      cv.width  = Math.round(im.width * s)
      cv.height = Math.round(im.height * s)
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height)
      store.setImg64(cv.toDataURL('image/jpeg', .88))
      URL.revokeObjectURL(url)
      store.setPhase('loaded')
    }
    im.src = url
  }, [store])

  // ── Classify + Analyse ─────────────────────────────────
  const handleAnalyse = useCallback(async () => {
    if (!store.img64) return
    store.setPhase('classifying')
    store.setError('')
    try {
      const c = await apiClassify(store.img64)
      store.bumpUsage('classify')
      if (c.error) throw new Error(c.error)
      store.setClsData(c)
      store.setPhase('analysing')

      const a = await apiAnalyze(c.class, c.category || c.class, c.bin?.type, c.confidence, c.is_waste !== false, store.lang.code)
      store.bumpUsage('chat')
      if (a.error) throw new Error(a.error)
      store.setAnaData(a)
      store.setPhase('result')
      store.setHistory([])

      // Auto-speak: use image_desc (already in chosen language) as intro, then steps
      const steps = Array.isArray(a.steps) ? a.steps : []
      const introLine = a.image_desc || `This is a ${c.class}.`
      const script = introLine + ' ' + steps.map((s, i) => `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`).join('. ')
      triggerTTS(script, true)

    } catch (err) {
      store.setPhase(store.clsData ? 'result' : 'loaded')
      store.setError('Could not identify — try a clearer, closer photo.')
      console.error(err)
    }
  }, [store])

  // ── TTS ────────────────────────────────────────────────
  const triggerTTS = useCallback(async (text, full = false, btn = null) => {
    store.stopRef.current = false
    store.setSpeaking(true)
    try {
      const r = await apiTTS(text, store.lang.code, store.voice.id, full)
      store.bumpUsage('tts', text.length)
      if (r.disabled || r.error || !r.audio) throw new Error('disabled')
      if (store.stopRef.current) return
      store.audRef.current.pause()
      store.audRef.current.src = `data:${r.mime || 'audio/mpeg'};base64,${r.audio}`
      await store.audRef.current.play()
      await new Promise(res => {
        store.audRef.current.onended = res
        store.audRef.current.onerror = res
      })
    } catch { }
    finally { store.setSpeaking(false) }
  }, [store])

  // ── Language change — retranslate + auto-speak in new language ───────────
  const handleLangChange = useCallback(async (newLang) => {
    store.setLang(newLang)
    store.stopSpeaking()

    if (store.clsData && store.anaData) {
      store.setAnaData(null) // show skeleton while re-translating
      try {
        const a = await apiAnalyze(
          store.clsData.class, store.clsData.category || store.clsData.class,
          store.clsData.bin?.type, store.clsData.confidence,
          store.clsData.is_waste !== false, newLang.code
        )
        store.bumpUsage('chat')
        if (!a.error) {
          store.setAnaData(a)

          // Auto-speak the translated content immediately
          const steps = Array.isArray(a.steps) ? a.steps : []
          const introLine = a.image_desc || `This is a ${store.clsData.class}.`
          const script = introLine + ' ' + steps.map((s, i) =>
            `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`
          ).join('. ')
          // Small delay so state settles before TTS fires
          setTimeout(() => triggerTTS(script, true), 300)

          // Also retranslate chat history
          if (store.history.length > 0) {
            const newHistory = []
            for (const msg of store.history) {
              if (msg.role === 'assistant') {
                try {
                  const r = await apiChat(
                    store.clsData.class, store.clsData.category || store.clsData.class,
                    store.clsData.bin?.type, store.clsData.confidence,
                    newLang.code,
                    [{ role: 'user', content: `Translate this to ${newLang.label}, keep the same meaning and tone: "${msg.content}"` }]
                  )
                  store.bumpUsage('chat')
                  newHistory.push({ ...msg, content: r.text || msg.content })
                } catch { newHistory.push(msg) }
              } else {
                newHistory.push(msg)
              }
            }
            store.setHistory(newHistory)
          }
        }
      } catch { }
    }
  }, [store, triggerTTS])

  // ── Chat send ──────────────────────────────────────────
  const handleChatSend = useCallback(async (text) => {
    if (!store.clsData) return
    const userMsg = { role: 'user', content: text }
    store.setHistory(h => [...h, userMsg])
    setChatLoading(true)
    try {
      const r = await apiChat(
        store.clsData.class, store.clsData.category || store.clsData.class,
        store.clsData.bin?.type, store.clsData.confidence,
        store.lang.code,
        [...store.history, userMsg]
      )
      store.bumpUsage('chat')
      if (r.error || !r.text) throw new Error('no text')
      const botMsg = { role: 'assistant', content: r.text, provider: r.provider }
      store.setHistory(h => [...h, botMsg])
      triggerTTS(r.text, false)
    } catch {
      store.setHistory(h => [...h, { role: 'assistant', content: 'Could not answer that right now — please try again.', provider: null }])
    } finally { setChatLoading(false) }
  }, [store, triggerTTS])

  // ── Read aloud — intro from LLM (already in chosen lang) + steps ─────────
  const handleReadAloud = useCallback(() => {
    if (!store.anaData || !store.clsData) return
    const steps = Array.isArray(store.anaData.steps) ? store.anaData.steps : []
    const introLine = store.anaData.image_desc || `This is a ${store.clsData.class}.`
    const script = introLine + ' ' + steps.map((s, i) => `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`).join('. ')
    triggerTTS(script, true)
  }, [store, triggerTTS])

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100svh', display: 'flex', flexDirection: 'column', paddingBottom: `calc(130px + env(safe-area-inset-bottom))` }}>

      <Header
        lang={store.lang}
        onLangChange={handleLangChange}
        onSettingsOpen={() => store.setSettingsOpen(true)}
        acColor={acColor}
      />

      <CameraZone
        img64={store.img64}
        clsData={store.clsData}
        phase={store.phase}
        onFile={handleFile}
      />

      {/* Scroll body */}
      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Error */}
        <AnimatePresence>
          {store.error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', fontSize: 12.5, color: '#ef4444', padding: '0 4px' }}
            >
              {store.error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton */}
        <AnimatePresence>
          {(store.phase === 'analysing' && !store.anaData) && (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis card */}
        <AnimatePresence>
          {store.anaData && (
            <motion.div key="ana" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AnalysisCard
                ana={store.anaData}
                cls={store.clsData}
                speaking={store.speaking}
                onReadAloud={handleReadAloud}
                onStop={store.stopSpeaking}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <AnimatePresence>
          {store.phase === 'result' && store.anaData && (
            <motion.div key="chat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ChatCard
                history={store.history}
                loading={chatLoading}
                onSend={handleChatSend}
                onListen={(text) => triggerTTS(text, false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>

      <BottomBar
        phase={store.phase}
        onShoot={() => fileRef.current?.click()}
        onAnalyse={handleAnalyse}
        onReset={store.reset}
        acColor={acColor}
      />

      {/* Hidden file input for BottomBar */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = '' }} />

      <SettingsDrawer
        open={store.settingsOpen}
        onClose={() => store.setSettingsOpen(false)}
        voice={store.voice}
        onVoiceChange={(v) => { store.setVoice(v); store.stopSpeaking() }}
        lang={store.lang}
        onLangChange={handleLangChange}
        usage={store.usage}
      />
    </div>
  )
}
