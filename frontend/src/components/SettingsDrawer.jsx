import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Play, Square, BarChart2, Zap, MessageCircle, MapPin, Gauge, Search, Server } from 'lucide-react'
import { VOICES, LANGUAGES, VOICE_PREVIEWS, TTS_SPEEDS, CITIES } from '../constants.js'
import QuotaCard from './QuotaCard.jsx'

// ── Single voice card ──────────────────────────────────────────────────────
function VoiceCard({ v, active, onSelect, onPreview, playingId }) {
  const isPlaying = playingId === v.id
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(v)}
      style={{
        background: active ? 'var(--acs)' : 'var(--s2)',
        border: `1.5px solid ${active ? 'var(--ac)' : 'var(--ln2)'}`,
        borderRadius: 14, padding: '10px 11px',
        cursor: 'pointer', transition: 'border-color .15s, background .15s',
        display: 'flex', flexDirection: 'column', gap: 7, position: 'relative',
      }}
    >
      {/* Active dot */}
      {active && (
        <div style={{
          position: 'absolute', top: 7, right: 7,
          width: 7, height: 7, borderRadius: '50%', background: 'var(--ac)',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: active ? 'var(--acg)' : 'var(--s3)',
          border: active ? '2px solid var(--ac)' : '1px solid var(--ln2)',
          display: 'grid', placeItems: 'center', fontSize: 16,
        }}>
          {v.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--ac)' : 'var(--tx)', lineHeight: 1.2 }}>{v.name}</div>
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 1 }}>{v.tone}</div>
        </div>
      </div>

      {/* Preview button — tapping immediately plays */}
      <button
        onClick={e => { e.stopPropagation(); onPreview(v) }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: isPlaying ? 'var(--acg)' : 'var(--s3)',
          border: `1px solid ${isPlaying ? 'var(--ac)' : 'var(--ln2)'}`,
          borderRadius: 8, padding: '5px 8px',
          fontSize: 11, fontWeight: 600,
          color: isPlaying ? 'var(--ac)' : 'var(--tx3)',
          transition: 'all .15s',
        }}
      >
        {isPlaying
          ? <><Square size={10} fill="currentColor" /> Playing</>
          : <><Play size={10} fill="currentColor" /> Preview</>
        }
      </button>
    </motion.div>
  )
}

// ── Main drawer ────────────────────────────────────────────────────────────
export default function SettingsDrawer({
  open, onClose,
  voice, onVoiceChange,
  lang, onLangChange,
  ttsSpeed, onSpeedChange,
  city, onCityChange,
  usage, points, streak,
}) {
  const [tab, setTab]           = useState('voice')
  const [genderTab, setGender]  = useState('all')   // all | Male | Female
  const [search, setSearch]     = useState('')
  const [playingId, setPlayingId] = useState(null)
  const audRef = useRef(new Audio())
  const stopRef = useRef(false)

  // ── Preview: plays immediately, stops previous ─────────────────
  const handlePreview = async (v) => {
    // Stop any current preview
    stopRef.current = true
    audRef.current.pause()
    audRef.current.src = ''
    setPlayingId(null)

    if (playingId === v.id) return  // toggle off if same voice tapped

    stopRef.current = false
    setPlayingId(v.id)

    try {
      const previewText = VOICE_PREVIEWS[lang.code] || VOICE_PREVIEWS['en-IN']
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          language_code: lang.code,
          speaker: v.id,
          full: true,
          pace: 1.0,
        }),
      }).then(r => r.json())

      if (stopRef.current || r.disabled || !r.audio) {
        setPlayingId(null)
        return
      }
      audRef.current.src = `data:${r.mime || 'audio/mpeg'};base64,${r.audio}`
      await audRef.current.play()
      await new Promise(res => {
        audRef.current.onended = res
        audRef.current.onerror = res
      })
    } catch {}
    if (!stopRef.current) setPlayingId(null)
  }

  const stopPreview = () => {
    stopRef.current = true
    audRef.current.pause()
    audRef.current.src = ''
    setPlayingId(null)
  }

  // Filter voices
  const filtered = VOICES.filter(v => {
    const matchGender = genderTab === 'all' || v.gender === genderTab
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.tone.toLowerCase().includes(search.toLowerCase())
    return matchGender && matchSearch
  })

  const tabStyle = (t) => ({
    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, borderRadius: 8,
    background: tab === t ? 'var(--s3)' : 'transparent',
    color: tab === t ? 'var(--tx)' : 'var(--tx3)',
    border: tab === t ? '1px solid var(--ln2)' : '1px solid transparent',
    transition: 'all .2s',
  })

  const gTabStyle = (t) => ({
    flex: 1, padding: '6px 0', fontSize: 11.5, fontWeight: 600, borderRadius: 7,
    background: genderTab === t ? 'var(--acs)' : 'transparent',
    color: genderTab === t ? 'var(--ac)' : 'var(--tx3)',
    border: genderTab === t ? '1px solid var(--acg)' : '1px solid transparent',
    transition: 'all .15s',
  })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) { stopPreview(); onClose() } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,.65)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 430, margin: '0 auto',
              background: 'var(--s1)', borderRadius: '20px 20px 0 0',
              border: '1px solid var(--ln2)', borderBottom: 'none',
              maxHeight: '92svh', display: 'flex', flexDirection: 'column',
              paddingBottom: `calc(16px + env(safe-area-inset-bottom))`,
            }}
          >
            {/* Handle */}
            <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--ln2)', margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 17 }}>Settings</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>🔥 {streak} · ⭐ {points} pts</span>
                  <button
                    onClick={() => { stopPreview(); onClose() }}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--s3)', display: 'grid', placeItems: 'center' }}
                  >
                    <X size={15} color="var(--tx2)" />
                  </button>
                </div>
              </div>

              {/* Main tabs */}
              <div style={{ display: 'flex', gap: 5, background: 'var(--s2)', borderRadius: 10, padding: 4, marginBottom: 2 }}>
                <button style={tabStyle('voice')} onClick={() => setTab('voice')}>🎙 Voice</button>
                <button style={tabStyle('city')}  onClick={() => setTab('city')}>🏙 City</button>
                <button style={tabStyle('usage')} onClick={() => setTab('usage')}>📊 Usage</button>
                <button style={tabStyle('api')}   onClick={() => setTab('api')}>🔌 API</button>
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 0' }}>

              {/* ── VOICE TAB ─────────────────────────────────── */}
              {tab === 'voice' && (
                <>
                  {/* Language grid */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>
                      Output language
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => onLangChange(l)} style={{
                          padding: '7px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: lang.code === l.code ? 'var(--acs)' : 'var(--s2)',
                          border: `1.5px solid ${lang.code === l.code ? 'var(--ac)' : 'var(--ln2)'}`,
                          color: lang.code === l.code ? 'var(--ac)' : 'var(--tx2)',
                          transition: 'all .15s', textAlign: 'center',
                        }}>
                          <div>{l.short}</div>
                          <div style={{ fontSize: 8.5, opacity: .7, marginTop: 1 }}>{l.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                      <Gauge size={11} color="var(--tx3)" />
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>Speed</span>
                    </div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {TTS_SPEEDS.map(s => (
                        <button key={s.id} onClick={() => onSpeedChange(s)} style={{
                          flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                          background: ttsSpeed?.id === s.id ? 'var(--acs)' : 'var(--s2)',
                          border: `1.5px solid ${ttsSpeed?.id === s.id ? 'var(--ac)' : 'var(--ln2)'}`,
                          color: ttsSpeed?.id === s.id ? 'var(--ac)' : 'var(--tx2)',
                          transition: 'all .15s',
                        }}>{s.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Voice section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>
                      Voice · {voice.name} selected
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{filtered.length} voices</span>
                  </div>

                  {/* Gender filter + search row */}
                  <div style={{ display: 'flex', gap: 7, marginBottom: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flex: 1, gap: 5, background: 'var(--s2)', borderRadius: 9, padding: 3 }}>
                      {['all', 'Male', 'Female'].map(g => (
                        <button key={g} style={gTabStyle(g)} onClick={() => setGender(g)}>
                          {g === 'all' ? 'All' : g === 'Male' ? '👨 Male' : '👩 Female'}
                        </button>
                      ))}
                    </div>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Search size={12} color="var(--tx3)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        style={{
                          background: 'var(--s2)', border: '1px solid var(--ln2)',
                          borderRadius: 9, padding: '7px 10px 7px 26px',
                          fontSize: 12, color: 'var(--tx)', width: 90, outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Voice grid — 2 col */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingBottom: 8 }}>
                    {filtered.map(v => (
                      <VoiceCard
                        key={v.id} v={v}
                        active={voice.id === v.id}
                        onSelect={(v) => { onVoiceChange(v); stopPreview() }}
                        onPreview={handlePreview}
                        playingId={playingId}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--tx3)', fontSize: 13, padding: '20px 0' }}>
                        No voices match "{search}"
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── CITY TAB ──────────────────────────────────── */}
              {tab === 'city' && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 10 }}>Your city</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {CITIES.map(c => (
                      <button key={c.id} onClick={() => onCityChange(c)} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13,
                        background: city?.id === c.id ? 'var(--acs)' : 'var(--s2)',
                        border: `1.5px solid ${city?.id === c.id ? 'var(--ac)' : 'var(--ln2)'}`,
                        transition: 'all .15s', textAlign: 'left',
                      }}>
                        <MapPin size={14} color={city?.id === c.id ? 'var(--ac)' : 'var(--tx3)'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: city?.id === c.id ? 'var(--ac)' : 'var(--tx)' }}>{c.name}</div>
                          {c.state && <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{c.state} · {c.authority}</div>}
                        </div>
                        {city?.id === c.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ac)', flexShrink: 0 }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── USAGE TAB ─────────────────────────────────── */}
              {tab === 'usage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: <Zap size={15} />,           label: 'Vision calls (Groq)',     value: usage.classifyCalls,              color: '#4f8ef7' },
                    { icon: <MessageCircle size={15} />, label: 'Chat / Analyse calls',     value: usage.chatCalls,                  color: '#d97706' },
                    { icon: <Volume2 size={15} />,       label: 'TTS calls (Sarvam)',       value: usage.ttsCalls,                   color: '#22c55e' },
                    { icon: <BarChart2 size={15} />,     label: 'Total chars synthesised',  value: usage.totalChars.toLocaleString(), color: '#8b5cf6' },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--s2)', border: '1px solid var(--ln)', borderRadius: 14, padding: '12px 14px',
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${row.color}22`, border: `1px solid ${row.color}44`, display: 'grid', placeItems: 'center', flexShrink: 0, color: row.color }}>
                        {row.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{row.label}</div>
                        <div style={{ fontSize: 20, fontFamily: 'var(--fh)', fontWeight: 700, color: 'var(--tx)', lineHeight: 1.2 }}>{row.value}</div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: 'var(--tx3)', textAlign: 'center', marginTop: 4 }}>
                    Session stats only — resets on page refresh.
                  </p>
                </div>
              )}

              {/* ── API TAB ───────────────────────────────────── */}
              {tab === 'api' && <QuotaCard />}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
