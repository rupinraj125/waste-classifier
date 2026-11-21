import React from 'react'
import { Camera, Search, RotateCcw } from 'lucide-react'
import Dots from './Dots.jsx'

export default function BottomBar({ phase, onShoot, onAnalyse, onReset, acColor }) {
  const isIdle       = phase === 'idle'
  const isLoaded     = phase === 'loaded'
  const isLoading    = phase === 'classifying' || phase === 'analysing'
  const isResult     = phase === 'result'

  const base = {
    width: '100%', padding: '14px 0', borderRadius: 16,
    fontSize: 15, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: 'pointer',
  }
  const primary = {
    ...base,
    background: `linear-gradient(135deg, ${acColor}, ${acColor}bb)`,
    color: '#fff',
    boxShadow: `0 4px 24px ${acColor}44`,
  }
  const ghost = {
    ...base,
    background: 'var(--s2)',
    color: 'var(--tx2)',
    border: '1.5px solid var(--ln2)',
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 100,
      padding: `8px 16px calc(env(safe-area-inset-bottom) + 8px)`,
      background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>

      {/* Primary action */}
      {isIdle && (
        <button onClick={onShoot} style={primary}>
          <Camera size={18} /> Take a photo
        </button>
      )}

      {(isLoaded || isLoading) && (
        <button
          onClick={!isLoading ? onAnalyse : undefined}
          disabled={isLoading}
          style={{ ...primary, opacity: isLoading ? .75 : 1, cursor: isLoading ? 'default' : 'pointer' }}
        >
          {isLoading
            ? <><Dots />&nbsp;{phase === 'classifying' ? 'Identifying…' : 'Analysing…'}</>
            : <><Search size={18} /> Identify &amp; Analyse</>
          }
        </button>
      )}

      {/* Secondary — always separate row, never stacked on primary */}
      {(isLoaded || isLoading || isResult) && (
        <button onClick={onReset} style={ghost}>
          <RotateCcw size={16} /> Scan another item
        </button>
      )}
    </div>
  )
}
