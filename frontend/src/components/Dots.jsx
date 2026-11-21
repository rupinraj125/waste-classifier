import React from 'react'

export default function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 180, 360].map((delay, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--ac)',
          display: 'inline-block',
          animation: `dotpulse 1.1s ease-in-out ${delay}ms infinite`,
        }} />
      ))}
      <style>{`
        @keyframes dotpulse {
          0%,100% { opacity:.18; transform:scale(.78); }
          50% { opacity:1; transform:scale(1); }
        }
      `}</style>
    </span>
  )
}
