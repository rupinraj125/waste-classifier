import React from 'react'
import { motion } from 'framer-motion'
import { RECYCLABILITY, CO2_STATS } from '../constants.js'
import { Leaf } from 'lucide-react'

export default function RecyclabilityScore({ category, acColor }) {
  const rec  = RECYCLABILITY[category] || RECYCLABILITY['trash']
  const co2  = CO2_STATS[category]     || CO2_STATS['trash']
  const pct  = rec.score

  const arcPath = (pct) => {
    const r = 28, cx = 36, cy = 36
    const startAngle = -210
    const sweep = (pct / 100) * 240
    const endAngle = startAngle + sweep
    const toRad = d => (d * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(startAngle))
    const y1 = cy + r * Math.sin(toRad(startAngle))
    const x2 = cx + r * Math.cos(toRad(endAngle))
    const y2 = cy + r * Math.sin(toRad(endAngle))
    const large = sweep > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--ln)',
      borderRadius: 16, padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>
        Recyclability
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Gauge */}
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width={72} height={72} viewBox="0 0 72 72">
            {/* Track */}
            <path d={arcPath(100)} fill="none" stroke="var(--s4)" strokeWidth={6} strokeLinecap="round" />
            {/* Fill */}
            <motion.path
              d={arcPath(pct)}
              fill="none" stroke={rec.color} strokeWidth={6} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: .9, ease: 'easeOut', delay: .2 }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 0,
          }}>
            <span style={{ fontSize: 17, fontFamily: 'var(--fh)', fontWeight: 800, color: rec.color, lineHeight: 1 }}>{pct}%</span>
          </div>
        </div>

        {/* Label + note */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: rec.color, marginBottom: 3 }}>{rec.label}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5 }}>{rec.note}</div>
        </div>
      </div>

      {/* CO2 stat */}
      {co2.saved > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
          background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
          borderRadius: 10,
        }}>
          <Leaf size={15} color="#22c55e" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5 }}>
            Recycling this saves <span style={{ color: '#22c55e', fontWeight: 700 }}>{co2.saved}{co2.unit}</span>
            {' '}— like <span style={{ fontWeight: 600 }}>{co2.equiv}</span>
          </div>
        </div>
      )}
    </div>
  )
}
