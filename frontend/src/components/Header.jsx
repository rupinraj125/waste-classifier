import React from 'react'
import { Settings, ChevronDown, Globe } from 'lucide-react'
import { LANGUAGES } from '../constants.js'

export default function Header({ lang, onLangChange, onSettingsOpen, acColor }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px 10px',
      position: 'sticky', top: 0, zIndex: 40,
      background: 'linear-gradient(to bottom, var(--bg) 70%, transparent)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: `conic-gradient(from 180deg, ${acColor} 0%, #7aadff 50%, ${acColor} 100%)`,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 0 0 1.5px ${acColor}44, 0 4px 18px ${acColor}44`,
          transition: 'box-shadow .4s, background .4s',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--fh)', fontWeight: 800, fontSize: 19, letterSpacing: '-.03em', lineHeight: 1 }}>
          Which <span style={{ color: acColor, transition: 'color .4s' }}>bin?</span>
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Language */}
        <label style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--s2)', border: '1.5px solid var(--ln2)',
          borderRadius: 999, padding: '6px 10px 6px 12px', cursor: 'pointer',
        }}>
          <Globe size={12} color="var(--tx3)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }}>
            {LANGUAGES.find(l => l.code === lang.code)?.short || 'EN'}
          </span>
          <ChevronDown size={11} color="var(--tx3)" />
          <select
            value={lang.code}
            onChange={e => onLangChange(LANGUAGES.find(l => l.code === e.target.value))}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </label>

        {/* Settings */}
        <button
          onClick={onSettingsOpen}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--s2)', border: '1.5px solid var(--ln2)',
            display: 'grid', placeItems: 'center',
            transition: 'border-color .2s, background .2s',
          }}
          aria-label="Settings"
        >
          <Settings size={15} color="var(--tx2)" />
        </button>
      </div>
    </header>
  )
}
