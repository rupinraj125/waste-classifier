import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Search, RotateCcw } from 'lucide-react'
import Dots from './Dots.jsx'

export default function BottomBar({ phase, onShoot, onAnalyse, onReset, acColor }) {
  const showShoot    = phase === 'idle'
  const showAnalyse  = phase === 'loaded' || phase === 'classifying' || phase === 'analysing'
  const showReset    = phase === 'result' || phase === 'analysing' || phase === 'loaded' || phase === 'classifying'
  const isLoading    = phase === 'classifying' || phase === 'analysing'

  const btnBase = {
    width: '100%', padding: 15, borderRadius: 16,
    fontSize: 15, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'transform .08s, opacity .15s',
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 100,
      padding: `10px 16px calc(env(safe-area-inset-bottom) + 10px)`,
      background: 'linear-gradient(to top, var(--bg) 55%, transparent)',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <AnimatePresence mode="wait">
        {showAnalyse && (
          <motion.button
            key="analyse"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            onClick={!isLoading ? onAnalyse : undefined}
            disabled={isLoading}
            style={{
              ...btnBase,
              background: `linear-gradient(135deg, ${acColor}, ${acColor}bb)`,
              color: '#fff',
              boxShadow: `0 4px 24px ${acColor}44`,
              opacity: isLoading ? .7 : 1,
            }}
            whileActive={{ scale: .975 }}
          >
            {isLoading ? (
              <><Dots />&nbsp;{phase === 'classifying' ? 'Identifying…' : 'Analysing…'}</>
            ) : (
              <><Search size={18} /> Identify &amp; Analyse</>
            )}
          </motion.button>
        )}

        {showShoot && (
          <motion.button
            key="shoot"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            onClick={onShoot}
            style={{
              ...btnBase,
              background: `linear-gradient(135deg, ${acColor}, ${acColor}bb)`,
              color: '#fff', boxShadow: `0 4px 24px ${acColor}44`,
            }}
          >
            <Camera size={18} /> Take a photo
          </motion.button>
        )}
      </AnimatePresence>

      {showReset && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={onReset}
          style={{
            ...btnBase,
            background: 'var(--s2)', color: 'var(--tx2)',
            border: '1.5px solid var(--ln2)',
          }}
        >
          <RotateCcw size={16} /> Scan another item
        </motion.button>
      )}
    </div>
  )
}
