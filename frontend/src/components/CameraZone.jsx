import React, { useRef } from 'react'
import { Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BIN_INFO } from '../constants.js'

export default function CameraZone({ img64, clsData, phase, onFile }) {
  const inputRef = useRef(null)
  const binInfo = clsData ? (BIN_INFO[clsData.bin?.type] || BIN_INFO.landfill) : null
  const hasResult = clsData && (phase === 'analysing' || phase === 'result')

  return (
    <>
      {/* Idle — fixed aspect ratio box */}
      {!img64 && (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            margin: '4px 16px 0',
            borderRadius: 24,
            background: 'var(--s1)',
            aspectRatio: '4/5',
            position: 'relative',
            border: '1.5px dashed var(--ln2)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: 24,
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--s3)', border: '1.5px solid var(--ln2)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 32px var(--acs)',
            }}
          >
            <Camera size={30} color="var(--ac)" />
          </motion.div>
          <p style={{ color: 'var(--tx3)', fontSize: 13.5, maxWidth: '22ch', lineHeight: 1.5 }}>
            Snap or upload any item — we'll tell you exactly where it goes
          </p>
          <small style={{ color: 'var(--tx3)', fontSize: 11, opacity: .6 }}>Tap anywhere to open camera</small>
        </div>
      )}

      {/* Loaded — photo with result strip BELOW (no clipping, natural height) */}
      {img64 && (
        <div style={{
          margin: '4px 16px 0',
          borderRadius: 24,
          overflow: 'hidden',
          border: `1.5px solid ${binInfo ? binInfo.color + '88' : 'var(--ln2)'}`,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Photo — fixed 16:11 so it doesn't eat all screen */}
          <div style={{ position: 'relative', aspectRatio: '16/11', overflow: 'hidden', background: '#000' }}>
            <img
              src={img64}
              alt="Uploaded item"
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />

            {/* Classifying spinner */}
            <AnimatePresence>
              {phase === 'classifying' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,.5)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    backdropFilter: 'blur(3px)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{
                      width: 44, height: 44, borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,.12)',
                      borderTopColor: 'var(--ac)',
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500 }}>
                    Identifying…
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top-3 confidence bar REMOVED — shown in composition card below instead */}
          </div>

          {/* Result strip — BELOW the photo, never overlapping */}
          <AnimatePresence>
            {hasResult && binInfo && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280, delay: .05 }}
                style={{
                  background: `linear-gradient(135deg, ${binInfo.color}f0, ${binInfo.color}b0)`,
                  padding: '14px 16px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}
              >
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: .15, type: 'spring', damping: 14 }}
                  style={{ fontSize: 44, lineHeight: 1, flexShrink: 0, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,.35))' }}
                >
                  {clsData.bin.emoji}
                </motion.div>

                <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
                  <div style={{
                    fontFamily: 'var(--fh)', fontWeight: 800, fontSize: 21,
                    letterSpacing: '-.025em', textTransform: 'capitalize',
                    textShadow: '0 1px 10px rgba(0,0,0,.3)',
                    wordBreak: 'break-word',
                  }}>
                    {clsData.class}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, opacity: .93, marginTop: 3 }}>
                    {binInfo.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'rgba(0,0,0,.25)', borderRadius: 999,
                      padding: '3px 10px', fontSize: 11, fontWeight: 600, opacity: .9,
                    }}>
                      {Math.round(clsData.confidence * 100)}% confident
                    </div>
                    {clsData.hazardous && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.25)',
                        borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                        letterSpacing: '.04em', textTransform: 'uppercase',
                      }}>
                        ⚠ Handle with care
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysing label shown below photo while waiting for LLM */}
          {phase === 'analysing' && !hasResult && (
            <div style={{
              padding: '10px 16px', background: 'var(--s2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,.12)',
                  borderTopColor: 'var(--ac)', flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--tx3)' }}>Getting detailed analysis…</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = '' }}
      />
    </>
  )
}
