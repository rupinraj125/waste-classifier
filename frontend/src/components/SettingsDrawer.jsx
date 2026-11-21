import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Play, Mic, BarChart2, Zap, MessageCircle } from 'lucide-react'
import { VOICES, LANGUAGES } from '../constants.js'

function VoiceCard({ v, active, onSelect, onPreview, previewing }) {
  return (
    <div
      onClick={() => onSelect(v)}
      style={{
        background: active ? 'var(--acs)' : 'var(--s2)',
        border: `1.5px solid ${active ? 'var(--ac)' : 'var(--ln2)'}`,
        borderRadius: 14, padding: '12px 13px',
        cursor: 'pointer', transition: 'border-color .15s, background .15s',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'var(--s3)', display: 'grid', placeItems: 'center', fontSize: 18,
          border: active ? '2px solid var(--ac)' : '1px solid var(--ln2)',
        }}>
          {v.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx)' }}>{v.name}</div>
          <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{v.gender} · {v.desc}</div>
        </div>
        {active && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ac)', flexShrink: 0 }} />
        )}
      </div>
      {/* Preview button */}
      <button
        onClick={e => { e.stopPropagation(); onPreview(v) }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'var(--s3)', border: '1px solid var(--ln2)', borderRadius: 8,
          padding: '7px 10px', fontSize: 12, fontWeight: 600,
          color: previewing ? 'var(--ac)' : 'var(--tx2)',
          transition: 'color .15s, background .15s',
        }}
      >
        <Play size={12} />
        {previewing ? 'Playing…' : 'Preview voice'}
      </button>
    </div>
  )
}

export default function SettingsDrawer({ open, onClose, voice, onVoiceChange, lang, onLangChange, usage }) {
  const [previewingId, setPreviewingId] = useState(null)
  const audRef = React.useRef(new Audio())
  const [tab, setTab] = useState('voice') // voice | usage

  // Realistic preview sentences per voice per language feel
  const PREVIEW_TEXTS = {
    'en-IN': {
      shubh:  'Please separate your dry waste from wet waste before disposal.',
      aditya: 'Hey! Did you know recycling one plastic bottle saves enough energy to power a light bulb for three hours?',
      ishita: 'Sort your waste correctly and help keep our city clean and green.',
      priya:  'Remember, batteries and electronics need special drop-off points, not regular bins.',
    },
    'hi-IN': {
      shubh:  'कृपया अपना सूखा और गीला कचरा अलग-अलग रखें।',
      aditya: 'क्या आप जानते हैं? एक प्लास्टिक बोतल को रिसाइकल करने से एक बल्ब तीन घंटे जल सकता है।',
      ishita: 'सही तरीके से कचरा छाँटें और अपने शहर को साफ रखें।',
      priya:  'बैटरी और इलेक्ट्रॉनिक्स को सामान्य कूड़ेदान में नहीं डालें।',
    },
  }

  const getPreviewText = (voiceId) => {
    const texts = PREVIEW_TEXTS[lang.code] || PREVIEW_TEXTS['en-IN']
    return texts[voiceId] || texts['shubh']
  }

  const handlePreview = async (v) => {
    setPreviewingId(v.id)
    try {
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: getPreviewText(v.id),
          language_code: lang.code,
          speaker: v.id,
          full: true,
        }),
      }).then(r => r.json())
      if (r.audio) {
        audRef.current.pause()
        audRef.current.src = `data:${r.mime || 'audio/mpeg'};base64,${r.audio}`
        await audRef.current.play()
        await new Promise(res => { audRef.current.onended = res; audRef.current.onerror = res })
      }
    } catch {}
    setPreviewingId(null)
  }

  const tabStyle = (t) => ({
    flex: 1, padding: '8px 0', fontSize: 12.5, fontWeight: 600, borderRadius: 8,
    background: tab === t ? 'var(--s3)' : 'transparent',
    color: tab === t ? 'var(--tx)' : 'var(--tx3)',
    border: tab === t ? '1px solid var(--ln2)' : '1px solid transparent',
    transition: 'all .2s',
  })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 430, margin: '0 auto',
              background: 'var(--s1)', borderRadius: '20px 20px 0 0',
              border: '1px solid var(--ln2)', borderBottom: 'none',
              maxHeight: '88svh', display: 'flex', flexDirection: 'column',
              paddingBottom: `calc(16px + env(safe-area-inset-bottom))`,
            }}
          >
            {/* Handle + header */}
            <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--ln2)', margin: '0 auto 14px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 17 }}>Settings</span>
                <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--s3)', display: 'grid', placeItems: 'center' }}>
                  <X size={15} color="var(--tx2)" />
                </button>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--s2)', borderRadius: 10, padding: 4 }}>
                <button style={tabStyle('voice')} onClick={() => setTab('voice')}>🎙 Voice</button>
                <button style={tabStyle('usage')} onClick={() => setTab('usage')}>📊 API Usage</button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 0' }}>
              {tab === 'voice' && (
                <>
                  {/* Language selector */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>Output language</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {LANGUAGES.map(l => (
                        <button
                          key={l.code}
                          onClick={() => onLangChange(l)}
                          style={{
                            padding: '8px 6px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                            background: lang.code === l.code ? 'var(--acs)' : 'var(--s2)',
                            border: `1.5px solid ${lang.code === l.code ? 'var(--ac)' : 'var(--ln2)'}`,
                            color: lang.code === l.code ? 'var(--ac)' : 'var(--tx2)',
                            transition: 'all .15s',
                          }}
                        >
                          {l.short} · {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice grid */}
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 8 }}>Voice</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {VOICES.map(v => (
                      <VoiceCard
                        key={v.id} v={v}
                        active={voice.id === v.id}
                        onSelect={onVoiceChange}
                        onPreview={handlePreview}
                        previewing={previewingId === v.id}
                      />
                    ))}
                  </div>
                </>
              )}

              {tab === 'usage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* API calls */}
                  {[
                    { icon: <Zap size={15} />, label: 'Vision calls (Groq)', value: usage.classifyCalls, color: '#4f8ef7' },
                    { icon: <MessageCircle size={15} />, label: 'Chat / Analyse calls', value: usage.chatCalls, color: '#d97706' },
                    { icon: <Volume2 size={15} />, label: 'TTS calls (Sarvam)', value: usage.ttsCalls, color: '#22c55e' },
                    { icon: <BarChart2 size={15} />, label: 'Total chars synthesised', value: usage.totalChars.toLocaleString(), color: '#8b5cf6' },
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
