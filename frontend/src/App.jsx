import React, { useRef, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BIN_INFO } from './constants.js'
import { classify as apiClassify, analyze as apiAnalyze, chat as apiChat, tts as apiTTS } from './api.js'
import { useStore } from './useStore.js'

import Header            from './components/Header.jsx'
import CameraZone        from './components/CameraZone.jsx'
import Skeleton          from './components/Skeleton.jsx'
import AnalysisCard      from './components/AnalysisCard.jsx'
import ChatCard          from './components/ChatCard.jsx'
import BottomBar         from './components/BottomBar.jsx'
import SettingsDrawer    from './components/SettingsDrawer.jsx'
import Footer            from './components/Footer.jsx'
import ConfidenceWarning from './components/ConfidenceWarning.jsx'
import ScanHistory       from './components/ScanHistory.jsx'
import StreakBar         from './components/StreakBar.jsx'

const haptic = (p) => { try { navigator.vibrate?.(p) } catch {} }

export default function App() {
  const store = useStore()
  const fileRef = useRef(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [earnedNow, setEarnedNow]     = useState(0)
  const [installPrompt, setInstallPrompt] = useState(null)

  // PWA install prompt capture
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const binInfo = store.clsData
    ? (BIN_INFO[store.clsData.bin?.type] || BIN_INFO.landfill)
    : BIN_INFO.recycle
  const acColor = binInfo.color

  // ── CSS accent vars ────────────────────────────────────────────
  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--ac',  binInfo.color)
    r.style.setProperty('--acl', '#7aadff')
    r.style.setProperty('--acg', binInfo.glow)
    r.style.setProperty('--acs', binInfo.soft)
  }, [binInfo])

  // ── Load image ─────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    haptic(10)
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

  // ── TTS — accepts explicit langCode to fix mid-session language-switch bug ──
  const triggerTTS = useCallback(async (text, full = false, langCode = null) => {
    store.stopRef.current = false
    store.setSpeaking(true)
    try {
      const pace   = store.ttsSpeed?.pace ?? 1.0
      const lc     = langCode || store.lang.code   // use explicit lang if provided
      const r = await apiTTS(text, lc, store.voice.id, full, pace)
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
    } catch {}
    finally { store.setSpeaking(false) }
  }, [store])

  // ── Classify + Analyse ─────────────────────────────────────────
  const handleAnalyse = useCallback(async () => {
    if (!store.img64) return
    haptic([20, 10, 20])
    store.setPhase('classifying')
    store.setError('')
    try {
      const c = await apiClassify(store.img64)
      store.bumpUsage('classify')
      if (c.error) throw new Error(c.error)
      store.setClsData(c)
      haptic(15)
      store.setPhase('analysing')

      const a = await apiAnalyze(c.class, c.category || c.class, c.bin?.type, c.confidence, c.is_waste !== false, store.lang.code)
      store.bumpUsage('chat')
      if (a.error) throw new Error(a.error)
      store.setAnaData(a)
      store.setPhase('result')
      store.setHistory([])

      // Award points + streak
      const pts = store.awardPoints(c.bin?.type)
      setEarnedNow(pts)
      setTimeout(() => setEarnedNow(0), 3000)
      haptic([10, 50, 20, 50, 30])

      // Add to scan log
      store.addScan({
        label:   c.class,
        binType: c.bin?.type,
        img64:   store.img64,
        ts:      Date.now(),
      })

      // Auto-speak
      const steps    = Array.isArray(a.steps) ? a.steps : []
      const introLine = a.image_desc || `This is a ${c.class}.`
      const script   = introLine + ' ' + steps.map((s, i) =>
        `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`
      ).join('. ')
      triggerTTS(script, true)

    } catch (err) {
      store.setPhase(store.clsData ? 'result' : 'loaded')
      store.setError('Could not identify — try a clearer, closer photo.')
      haptic([50, 100, 50])
      console.error(err)
    }
  }, [store, triggerTTS])

  // ── Confidence: user manually confirms an alternative ──────────
  const handleConfirm = useCallback(async (confirmedLabel, confirmedCategory) => {
    if (!store.clsData) return
    haptic(10)
    const updated = { ...store.clsData, class: confirmedLabel, category: confirmedCategory, confidence: 1.0 }
    store.setClsData(updated)
    store.setAnaData(null)
    store.setPhase('analysing')
    try {
      const a = await apiAnalyze(confirmedLabel, confirmedCategory, updated.bin?.type, 1.0, updated.is_waste !== false, store.lang.code)
      store.bumpUsage('chat')
      if (!a.error) {
        store.setAnaData(a)
        store.setPhase('result')
        const steps = Array.isArray(a.steps) ? a.steps : []
        const intro = a.image_desc || `This is a ${confirmedLabel}.`
        triggerTTS(intro + ' ' + steps.map((s, i) => `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`).join('. '), true)
      }
    } catch {}
  }, [store, triggerTTS])

  // ── Language change — retranslate + auto-speak in NEW language ───────────
  const handleLangChange = useCallback(async (newLang) => {
    store.stopSpeaking()           // stop any current audio immediately
    store.setLang(newLang)         // update lang state
    if (store.clsData && store.anaData) {
      store.setAnaData(null)       // show skeleton while refetching
      try {
        const a = await apiAnalyze(
          store.clsData.class, store.clsData.category || store.clsData.class,
          store.clsData.bin?.type, store.clsData.confidence,
          store.clsData.is_waste !== false, newLang.code
        )
        store.bumpUsage('chat')
        if (!a.error) {
          store.setAnaData(a)
          // Build script from freshly translated content
          const steps  = Array.isArray(a.steps) ? a.steps : []
          const intro  = a.image_desc || `This is a ${store.clsData.class}.`
          const script = intro + (steps.length
            ? ' ' + steps.map((s, i) =>
                `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`
              ).join('. ')
            : '')
          // Pass newLang.code explicitly — avoids stale closure reading old lang
          triggerTTS(script, true, newLang.code)

          // Retranslate chat history
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
              } else { newHistory.push(msg) }
            }
            store.setHistory(newHistory)
          }
        }
      } catch {}
    }
  }, [store, triggerTTS])

  // ── Chat send ──────────────────────────────────────────────────
  const handleChatSend = useCallback(async (text) => {
    if (!store.clsData) return
    haptic(8)
    const userMsg = { role: 'user', content: text }
    store.setHistory(h => [...h, userMsg])
    setChatLoading(true)
    try {
      const r = await apiChat(
        store.clsData.class, store.clsData.category || store.clsData.class,
        store.clsData.bin?.type, store.clsData.confidence,
        store.lang.code, [...store.history, userMsg]
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

  // ── Read aloud ─────────────────────────────────────────────────
  const handleReadAloud = useCallback(() => {
    if (!store.anaData || !store.clsData) return
    const steps    = Array.isArray(store.anaData.steps) ? store.anaData.steps : []
    const intro    = store.anaData.image_desc || `This is a ${store.clsData.class}.`
    const script   = intro + ' ' + steps.map((s, i) =>
      `Step ${i + 1}: ${String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}`
    ).join('. ')
    triggerTTS(script, true)
  }, [store, triggerTTS])

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100svh', display: 'flex', flexDirection: 'column', paddingBottom: `calc(130px + env(safe-area-inset-bottom))` }}>

      <Header lang={store.lang} onLangChange={handleLangChange} onSettingsOpen={() => store.setSettingsOpen(true)} acColor={acColor} />

      {/* Streak bar */}
      <StreakBar points={store.points} streak={store.streak} earnedNow={earnedNow} />

      {/* Scan history */}
      {store.scanLog.length > 0 && store.phase === 'idle' && (
        <div style={{ marginTop: 10 }}>
          <ScanHistory log={store.scanLog} onClear={store.clearLog} />
        </div>
      )}

      <CameraZone img64={store.img64} clsData={store.clsData} phase={store.phase} onFile={handleFile} />

      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Error */}
        <AnimatePresence>
          {store.error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', fontSize: 12.5, color: '#ef4444', padding: '0 4px' }}
            >{store.error}</motion.div>
          )}
        </AnimatePresence>

        {/* Confidence warning */}
        <AnimatePresence>
          {store.clsData && store.clsData.confidence < 0.6 && store.phase === 'result' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ConfidenceWarning clsData={store.clsData} onConfirm={handleConfirm} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton */}
        <AnimatePresence>
          {store.phase === 'analysing' && !store.anaData && (
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
                city={store.city}
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

        {/* PWA install banner */}
        <AnimatePresence>
          {installPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--s2)', border: '1px solid var(--ln2)',
                borderRadius: 14, padding: '10px 14px',
              }}
            >
              <span style={{ fontSize: 20 }}>📲</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>Install Which Bin?</div>
                <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>Add to home screen for instant access</div>
              </div>
              <button
                onClick={async () => {
                  installPrompt.prompt()
                  const { outcome } = await installPrompt.userChoice
                  if (outcome === 'accepted') setInstallPrompt(null)
                }}
                style={{ padding: '6px 12px', borderRadius: 8, background: acColor, color: '#fff', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}
              >
                Install
              </button>
              <button onClick={() => setInstallPrompt(null)} style={{ color: 'var(--tx3)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>

      <BottomBar phase={store.phase} onShoot={() => fileRef.current?.click()} onAnalyse={handleAnalyse} onReset={store.reset} acColor={acColor} />

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = '' }} />

      <SettingsDrawer
        open={store.settingsOpen}
        onClose={() => store.setSettingsOpen(false)}
        voice={store.voice}
        onVoiceChange={(v) => { store.setVoice(v); store.stopSpeaking() }}
        lang={store.lang}
        onLangChange={handleLangChange}
        ttsSpeed={store.ttsSpeed}
        onSpeedChange={store.setSpeed}
        city={store.city}
        onCityChange={store.setCity}
        usage={store.usage}
        points={store.points}
        streak={store.streak}
      />
    </div>
  )
}
