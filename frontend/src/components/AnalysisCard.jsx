import React from 'react'
import { motion } from 'framer-motion'
import { Volume2, Square, Eye, AlertTriangle, Lightbulb } from 'lucide-react'
import { BIN_INFO, PROV_LABEL } from '../constants.js'

function CompositionBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--s4)', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: .8, ease: 'easeOut', delay: .2 }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
        />
      </div>
    </div>
  )
}

function getComposition(category) {
  const map = {
    plastic:     [{ label: 'Polymer resin', value: 85, color: '#4f8ef7' }, { label: 'Additives', value: 10, color: '#7aadff' }, { label: 'Other', value: 5, color: '#272e48' }],
    glass:       [{ label: 'Silica (SiO₂)', value: 72, color: '#8b5cf6' }, { label: 'Soda ash', value: 15, color: '#a78bfa' }, { label: 'Limestone', value: 13, color: '#272e48' }],
    metal:       [{ label: 'Iron/Steel', value: 70, color: '#64748b' }, { label: 'Aluminium', value: 20, color: '#94a3b8' }, { label: 'Other metals', value: 10, color: '#272e48' }],
    cardboard:   [{ label: 'Cellulose fibre', value: 80, color: '#d97706' }, { label: 'Lignin', value: 15, color: '#f59e0b' }, { label: 'Moisture', value: 5, color: '#272e48' }],
    paper:       [{ label: 'Cellulose', value: 90, color: '#d97706' }, { label: 'Bleach/Dye', value: 7, color: '#f59e0b' }, { label: 'Other', value: 3, color: '#272e48' }],
    biological:  [{ label: 'Water', value: 70, color: '#22c55e' }, { label: 'Organic matter', value: 25, color: '#4ade80' }, { label: 'Minerals', value: 5, color: '#272e48' }],
    battery:     [{ label: 'Lithium/Lead', value: 40, color: '#ef4444' }, { label: 'Electrolyte', value: 35, color: '#f87171' }, { label: 'Casing', value: 25, color: '#272e48' }],
    electronics: [{ label: 'Metals (Au/Cu)', value: 45, color: '#fbbf24' }, { label: 'Plastics', value: 30, color: '#4f8ef7' }, { label: 'Glass/Other', value: 25, color: '#272e48' }],
    clothes:     [{ label: 'Cotton/Polyester', value: 75, color: '#8b5cf6' }, { label: 'Dyes', value: 15, color: '#a78bfa' }, { label: 'Other', value: 10, color: '#272e48' }],
    shoes:       [{ label: 'Rubber/Foam', value: 55, color: '#f97316' }, { label: 'Textile', value: 30, color: '#fb923c' }, { label: 'Other', value: 15, color: '#272e48' }],
    vegetation:  [{ label: 'Water', value: 60, color: '#22c55e' }, { label: 'Cellulose', value: 30, color: '#4ade80' }, { label: 'Minerals', value: 10, color: '#272e48' }],
    trash:       [{ label: 'Mixed waste', value: 60, color: '#64748b' }, { label: 'Non-recyclable', value: 30, color: '#94a3b8' }, { label: 'Unknown', value: 10, color: '#272e48' }],
  }
  return map[category] || map['trash']
}

export default function AnalysisCard({ ana, cls, speaking, onReadAloud, onStop }) {
  if (!ana || !cls) return null
  const binInfo = BIN_INFO[cls.bin?.type] || BIN_INFO.landfill
  const steps   = Array.isArray(ana.steps) ? ana.steps : []
  const isWaste = ana.is_waste !== false
  const composition = getComposition(cls.category || cls.class)

  const chipStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 999, padding: '4px 11px', fontSize: 12, fontWeight: 700, flexShrink: 0,
    ...(isWaste
      ? cls.bin?.type === 'compost'
        ? { background: 'rgba(217,119,6,.12)', color: '#fcd34d', border: '1px solid rgba(217,119,6,.25)' }
        : cls.bin?.type === 'hazardous'
        ? { background: 'rgba(239,68,68,.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.25)' }
        : { background: 'rgba(79,142,247,.12)', color: '#93c5fd', border: '1px solid rgba(79,142,247,.25)' }
      : { background: 'rgba(34,197,94,.1)', color: '#86efac', border: '1px solid rgba(34,197,94,.22)' })
  }

  const container = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: .07 } },
  }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      style={{ background: 'var(--s1)', border: '1px solid var(--ln)', borderRadius: 20, overflow: 'hidden' }}
    >
      {/* Provider row */}
      <motion.div variants={item} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
        borderBottom: '1px solid var(--ln)', background: 'var(--s2)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: binInfo.color, boxShadow: `0 0 8px ${binInfo.glow}`, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>Identified by</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: binInfo.color, marginLeft: 'auto' }}>
          {PROV_LABEL[ana.provider] || ana.provider || 'Groq'}
        </span>
      </motion.div>

      {/* AI Sees */}
      <motion.div variants={item} style={{ padding: '14px 14px 0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${binInfo.color}1a`, border: `1px solid ${binInfo.color}44`,
          display: 'grid', placeItems: 'center', marginTop: 1,
        }}>
          <Eye size={15} color={binInfo.color} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)', marginBottom: 3 }}>What the AI sees</div>
          <div style={{ fontSize: 13.5, color: 'var(--tx)', lineHeight: 1.55 }}>{ana.image_desc || `${cls.class} item`}</div>
        </div>
      </motion.div>

      {/* Verdict */}
      <motion.div variants={item} style={{ padding: '11px 14px 0', display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <div style={chipStyle}>{isWaste ? '⚠ Waste' : '✓ Not waste'}</div>
        <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5, flex: '1 1 100%' }}>{ana.waste_verdict}</div>
      </motion.div>

      {/* Steps */}
      <motion.div variants={item} style={{ padding: '14px 14px 6px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx3)' }}>
          How to dispose / recycle
        </span>
      </motion.div>
      <div style={{ padding: '0 14px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {steps.map((s, i) => (
          <motion.div key={i} variants={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              background: `linear-gradient(135deg, ${binInfo.color}, ${binInfo.color}bb)`,
              color: '#fff', fontSize: 11, fontWeight: 800,
              display: 'grid', placeItems: 'center',
              boxShadow: `0 2px 8px ${binInfo.glow}`,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--tx)', lineHeight: 1.6, paddingTop: 1 }}>
              {String(s).replace(/^step\s*\d+[:.)\-\s]*/i, '')}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hazard */}
      {ana.hazard_note && (
        <motion.div variants={item} style={{
          margin: '12px 14px 0', padding: '10px 12px', borderRadius: 12,
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.22)',
          display: 'flex', gap: 9, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} color="#fca5a5" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{ana.hazard_note}</div>
        </motion.div>
      )}

      {/* Tip */}
      {ana.quick_tip && (
        <motion.div variants={item} style={{
          margin: '9px 14px 0', padding: '10px 12px', borderRadius: 12,
          background: `${binInfo.color}1a`, border: `1px solid ${binInfo.color}44`,
          display: 'flex', gap: 9, alignItems: 'flex-start',
        }}>
          <Lightbulb size={15} color={binInfo.color} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5 }}>{ana.quick_tip}</div>
        </motion.div>
      )}

      {/* Waste composition */}
      <motion.div variants={item} style={{ padding: '14px 14px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx3)', marginBottom: 10 }}>
          Waste Composition
        </div>
        {composition.map((c, i) => (
          <CompositionBar key={i} label={c.label} value={c.value} color={c.color} />
        ))}
      </motion.div>

      {/* Read Aloud */}
      <motion.div variants={item} style={{ padding: '12px 14px 14px', display: 'flex', gap: 8 }}>
        {!speaking ? (
          <button
            onClick={onReadAloud}
            disabled={steps.length === 0}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'var(--s3)', border: '1.5px solid var(--ln2)', borderRadius: 12,
              padding: '11px 14px', fontSize: 13.5, fontWeight: 600, color: binInfo.color,
              opacity: steps.length === 0 ? .38 : 1, cursor: steps.length === 0 ? 'default' : 'pointer',
              transition: 'background .15s',
            }}
          >
            <Volume2 size={15} />
            Read steps aloud
          </button>
        ) : (
          <button
            onClick={onStop}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12,
              padding: '11px 14px', fontSize: 13.5, fontWeight: 600, color: '#fca5a5',
              transition: 'background .15s',
            }}
          >
            <Square size={15} />
            Stop reading
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
