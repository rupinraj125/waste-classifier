import React from 'react'

export default function Footer() {
  return (
    <footer style={{ padding: '8px 20px 12px', textAlign: 'center' }}>
      {/* Credits */}
      <div style={{
        background: 'var(--s2)', border: '1px solid var(--ln)',
        borderRadius: 14, padding: '12px 16px', marginBottom: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 2 }}>
          Made by <span style={{ color: 'var(--ac)' }}>Rupin Raj</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
          Class 9 – A &nbsp;·&nbsp; Immanuel MHSS
        </div>
      </div>
      {/* Tech stack */}
      <p style={{ fontSize: 10.5, color: 'var(--tx3)', lineHeight: 1.7 }}>
        Vision &amp; chat by Groq (qwen3.8-27b) · voice by Sarvam AI<br/>
        A guide — always check local rules for hazardous items.
      </p>
    </footer>
  )
}
