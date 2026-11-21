import React from 'react'
import { MapPin, Phone, Calendar } from 'lucide-react'

export default function CityCard({ city, acColor }) {
  if (!city || city.id === 'other') return null

  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--ln)',
      borderRadius: 16, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${acColor}22`, border: `1px solid ${acColor}44`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <MapPin size={13} color={acColor} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>
          {city.name} collection schedule
        </span>
        <span style={{ fontSize: 10, color: 'var(--tx3)', marginLeft: 'auto' }}>{city.authority}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--s3)', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 2 }}>🔵 Dry waste</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)' }}>{city.dryDay}</div>
        </div>
        <div style={{ background: 'var(--s3)', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 2 }}>🟢 Wet waste</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)' }}>{city.wetDay}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: 'var(--s3)', borderRadius: 10 }}>
        <Phone size={12} color="var(--tx3)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Helpline: <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{city.hotline}</span></span>
      </div>
    </div>
  )
}
