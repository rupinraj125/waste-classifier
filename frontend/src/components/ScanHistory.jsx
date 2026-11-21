import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2 } from 'lucide-react'
import { BIN_INFO } from '../constants.js'

export default function ScanHistory({ log, onSelect, onClear }) {
  if (!log || log.length === 0) return null

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} color="var(--tx3)" />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>
            Recent scans
          </span>
        </div>
        <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--tx3)', padding: '2px 6px', borderRadius: 6, background: 'var(--s2)' }}>
          <Trash2 size={10} /> Clear
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {log.map((entry, i) => {
          const bin = BIN_INFO[entry.binType] || BIN_INFO.landfill
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * .04 }}
              onClick={() => onSelect && onSelect(entry)}
              style={{
                flexShrink: 0, width: 64, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 12,
                background: 'var(--s2)', border: `1px solid ${bin.color}44`,
                cursor: 'pointer', transition: 'border-color .15s',
              }}
            >
              {entry.img64 ? (
                <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={entry.img64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${bin.color}22`, display: 'grid', placeItems: 'center', fontSize: 20 }}>
                  {bin.emoji}
                </div>
              )}
              <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--tx2)', textTransform: 'capitalize', textAlign: 'center', lineHeight: 1.3, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.label}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
