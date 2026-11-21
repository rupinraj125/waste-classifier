import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Star } from 'lucide-react'

export default function StreakBar({ points, streak, earnedNow }) {
  const [showBadge, setShowBadge] = useState(!!earnedNow)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 0' }}>
      {/* Streak */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--s2)', border: '1px solid var(--ln2)',
        borderRadius: 999, padding: '5px 10px',
      }}>
        <Flame size={13} color={streak > 0 ? '#f97316' : 'var(--tx3)'} />
        <span style={{ fontSize: 12, fontWeight: 700, color: streak > 0 ? '#f97316' : 'var(--tx3)' }}>
          {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Points */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--s2)', border: '1px solid var(--ln2)',
        borderRadius: 999, padding: '5px 10px',
      }}>
        <Star size={13} color="#fbbf24" fill="#fbbf24" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx2)' }}>
          {points.toLocaleString()} pts
        </span>
      </div>

      {/* Earned badge — pops up when user gets new points */}
      <AnimatePresence>
        {earnedNow > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: .6, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .6, y: -4 }}
            transition={{ type: 'spring', damping: 14 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.35)',
              borderRadius: 999, padding: '5px 10px',
              fontSize: 12, fontWeight: 700, color: '#fbbf24',
            }}
          >
            +{earnedNow} pts!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
