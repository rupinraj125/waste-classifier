import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { BIN_INFO } from '../constants.js'

export default function ConfidenceWarning({ clsData, onConfirm }) {
  if (!clsData || clsData.confidence >= 0.6) return null

  const top3 = clsData.top3 || []
  const others = top3.filter(t => t.class !== clsData.class).slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.25)',
        borderRadius: 14, padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
        <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 2 }}>
            Not fully sure ({Math.round(clsData.confidence * 100)}% confident)
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5 }}>
            Try a clearer, closer photo — or confirm one of these:
          </div>
        </div>
      </div>

      {/* Alternative chips */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {/* Current guess */}
        <button
          onClick={() => onConfirm(clsData.class, clsData.category)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
            background: 'rgba(251,191,36,.15)', border: '1.5px solid rgba(251,191,36,.4)',
            color: '#fbbf24', cursor: 'pointer', transition: 'background .15s',
          }}
        >
          {BIN_INFO[clsData.bin?.type]?.emoji} {clsData.class} ({Math.round(clsData.confidence * 100)}%)
        </button>
        {/* Alternatives */}
        {others.map(alt => {
          const b = clsData.top3.find(t => t.class === alt.class)
          return (
            <button
              key={alt.class}
              onClick={() => onConfirm(alt.class, alt.class)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                background: 'var(--s3)', border: '1.5px solid var(--ln2)',
                color: 'var(--tx2)', cursor: 'pointer', transition: 'background .15s',
              }}
            >
              {alt.class} ({Math.round(alt.confidence * 100)}%)
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
