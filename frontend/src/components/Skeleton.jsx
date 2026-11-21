import React from 'react'

const Line = ({ w = '90%', h = 11 }) => (
  <div style={{
    width: w, height: h, borderRadius: 999,
    background: 'var(--s4)',
    animation: 'skpulse 1.5s ease-in-out infinite',
  }} />
)

export default function Skeleton() {
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--ln)',
      borderRadius: 20, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 11,
    }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:.35}50%{opacity:.85}}`}</style>
      <Line w="80%" h={16} />
      <Line w="90%" />
      <Line w="65%" />
      <div style={{ height: 4 }} />
      <Line w="90%" />
      <Line w="75%" />
      <Line w="55%" />
      <Line w="70%" />
    </div>
  )
}
