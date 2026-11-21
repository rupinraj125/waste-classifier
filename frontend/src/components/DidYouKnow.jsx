import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronRight } from 'lucide-react'
import { DID_YOU_KNOW } from '../constants.js'

export default function DidYouKnow({ category, acColor }) {
  const facts = DID_YOU_KNOW[category] || DID_YOU_KNOW['trash']
  const [idx, setIdx] = useState(0)

  useEffect(() => { setIdx(0) }, [category])

  const next = () => setIdx(i => (i + 1) % facts.length)

  return (
    <div style={{
      background: 'var(--s2)', border: `1px solid ${acColor}44`,
      borderRadius: 16, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap:7 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${acColor}22`, border: `1px solid ${acColor}44`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Lightbulb size={13} color={acColor} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>
          Did you know?
        </span>
        <span style={{ fontSize: 10, color: 'var(--tx3)', marginLeft: 'auto' }}>{idx + 1}/{facts.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: .2 }}
          style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6, margin: 0 }}
        >
          {facts[idx]}
        </motion.p>
      </AnimatePresence>

      <button
        onClick={next}
        style={{
          alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11.5, fontWeight: 600, color: acColor,
          padding: '4px 8px', borderRadius: 8, background: `${acColor}18`,
          border: `1px solid ${acColor}33`,
        }}
      >
        Next fact <ChevronRight size={12} />
      </button>
    </div>
  )
}
