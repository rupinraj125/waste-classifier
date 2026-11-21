import React, { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react'

const STATUS_ICON = {
  active:   { Icon: CheckCircle2, color: '#22c55e' },
  limited:  { Icon: AlertCircle,   color: '#f59e0b' },
  inactive: { Icon: XCircle,       color: '#ef4444' },
  unknown:  { Icon: AlertCircle,   color: '#64748b' },
}

function ServiceRow({ name, data, color }) {
  if (!data) return null
  
  const status = data.status || 'unknown'
  const { Icon, color: statusColor } = STATUS_ICON[status] || STATUS_ICON.unknown

  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--ln)',
      borderRadius: 12, padding: '11px 13px',
      display: 'flex', alignItems: 'center', gap: 11,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon size={16} color={statusColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{name}</span>
          {data.plan && (
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              background: `${color}22`, color,
              padding: '2px 6px', borderRadius: 5,
            }}>
              {data.plan}
            </span>
          )}
        </div>
        {data.error ? (
          <div style={{ fontSize: 11, color: '#ef4444' }}>{data.error}</div>
        ) : (
          <>
            {data.limit && (
              <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Limit: {data.limit}</div>
            )}
            {data.note && (
              <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>{data.note}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function QuotaCard() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fetchQuota = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/quota')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const json = await r.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuota()
  }, [])

  if (error) {
    return (
      <div style={{
        background: 'var(--s2)', border: '1px solid var(--ln)',
        borderRadius: 14, padding: '14px 16px', textAlign: 'center',
      }}>
        <AlertCircle size={20} color="#ef4444" style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>
          Failed to load API quota: {error}
        </div>
        <button
          onClick={fetchQuota}
          style={{
            background: 'var(--s3)', border: '1px solid var(--ln2)',
            borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600,
            color: 'var(--tx2)', display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div style={{
        background: 'var(--s2)', border: '1px solid var(--ln)',
        borderRadius: 14, padding: '20px', textAlign: 'center',
      }}>
        <Loader2 size={20} color="var(--tx3)" style={{ animation: 'spin 1s linear infinite', marginBottom: 6 }} />
        <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Checking API quotas...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>
          API Status
        </span>
        <button
          onClick={fetchQuota}
          disabled={loading}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--tx3)', fontSize: 10, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}
        >
          <RefreshCw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <ServiceRow name="Groq (Vision + Chat)" data={data.groq}   color="#4f8ef7" />
      <ServiceRow name="Gemini (Fallback)"     data={data.gemini} color="#8b5cf6" />
      <ServiceRow name="Sarvam (TTS)"          data={data.sarvam} color="#22c55e" />
    </div>
  )
}
