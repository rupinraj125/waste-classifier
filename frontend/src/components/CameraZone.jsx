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
      <div
        style={{
          margin: '4px 16px 0',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'var(--s1)',
          aspectRatio: img64 ? '4/5' : '4/5',
          position: 'relative',
          border: `1.5px ${img64 ? 'solid' : 'dashed'} var(--ln2)`,
          cursor: img64 ? 'default' : 'pointer',
          transition: 'border-color .25s',
        }}
        onClick={() => !img64 && inputRef.current?.click()}
      >
        {/* Idle state */}
        <AnimatePresence>
          {!img64 && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 14, padding: 24, textAlign: 'center',
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo + result */}
        <AnimatePresence>
          {img64 && (
            <motion.div
              key="photo"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
            >
              {/* Photo */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#000' }}>
                <img
                  src={img64}
                  alt="Uploaded item"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Loading shimmer overlay */}
                <AnimatePresence>
                  {phase === 'classifying' && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          border: '3px solid rgba(255,255,255,.15)',
                          borderTopColor: 'var(--ac)',
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Result strip */}
              <AnimatePresence>
                {hasResult && binInfo && (
                  <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    style={{
                      background: `linear-gradient(to bottom, ${binInfo.color}ee, ${binInfo.color}99)`,
                      padding: '14px 18px 10px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: .1, type: 'spring', damping: 15 }}
                      style={{ fontSize: 42, lineHeight: 1, flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.4))' }}
                    >
                      {clsData.bin.emoji}
                    </motion.div>
                    <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
                      <div style={{
                        fontFamily: 'var(--fh)', fontWeight: 800, fontSize: 22,
                        letterSpacing: '-.025em', textTransform: 'capitalize',
                        textShadow: '0 1px 10px rgba(0,0,0,.35)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {clsData.class}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, opacity: .92, marginTop: 1 }}>
                        {binInfo.label}
                      </div>
                      <div style={{ fontSize: 11, opacity: .6, marginTop: 1 }}>
                        {Math.round(clsData.confidence * 100)}% confident
                      </div>
                      {clsData.hazardous && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5,
                          padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                          letterSpacing: '.05em', textTransform: 'uppercase',
                          background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.2)',
                        }}>
                          ⚠ Handle with care
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-3 bar */}
        <AnimatePresence>
          {hasResult && clsData?.top3?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', bottom: hasResult ? 'calc(10px + 80px)' : 0,
                left: 0, right: 0,
                background: 'rgba(0,0,0,.62)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                padding: '7px 14px 9px',
                display: 'flex', gap: 10,
              }}
            >
              {clsData.top3.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'capitalize', opacity: .8, color: '#fff' }}>
                    {t.class}
                  </div>
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,.15)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(t.confidence * 100)}%` }}
                      transition={{ delay: .3 + i * .1, duration: .6, ease: 'easeOut' }}
                      style={{ height: '100%', background: '#fff', borderRadius: 999 }}
                    />
                  </div>
                  <div style={{ fontSize: 9, opacity: .55, color: '#fff' }}>{Math.round(t.confidence * 100)}%</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
