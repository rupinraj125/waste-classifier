import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Volume2 } from 'lucide-react'
import { PROV_LABEL } from '../constants.js'
import Dots from './Dots.jsx'

function Bubble({ msg, onListen }) {
  const isMe = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4, maxWidth: '86%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}
    >
      <div style={{
        padding: '10px 13px', fontSize: 13.5, lineHeight: 1.6,
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
        borderRadius: 16,
        ...(isMe
          ? { background: 'linear-gradient(135deg, var(--ac), var(--acl))', color: '#fff', borderBottomRightRadius: 4 }
          : { background: 'var(--s3)', border: '1px solid var(--ln2)', borderBottomLeftRadius: 4, color: 'var(--tx)' })
      }}>
        {msg.content}
      </div>
      {!isMe && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <button
            onClick={() => onListen(msg.content)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ac)', fontSize: 11, fontWeight: 600, padding: '1px 0' }}
          >
            <Volume2 size={12} /> Listen
          </button>
          {msg.provider && PROV_LABEL[msg.provider] && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--tx3)', background: 'var(--s4)', borderRadius: 4, padding: '2px 5px' }}>
              {PROV_LABEL[msg.provider]}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function ChatCard({ history, loading, onSend, onListen }) {
  const [input, setInput] = useState('')
  const threadRef = useRef(null)

  useEffect(() => {
    threadRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [history, loading])

  const handleSend = () => {
    const t = input.trim()
    if (!t) return
    setInput('')
    onSend(t)
  }

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--ln)', borderRadius: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--ln)',
        background: 'var(--s2)', borderRadius: '20px 20px 0 0',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ac)', boxShadow: '0 0 6px var(--acg)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--tx3)' }}>Ask a follow-up</span>
      </div>

      {/* Thread */}
      <div ref={threadRef} style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '12px 12px 10px' }}>
        <AnimatePresence>
          {history.map((msg, i) => (
            <Bubble key={i} msg={msg} onListen={onListen} />
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              alignSelf: 'flex-start', padding: '10px 13px',
              background: 'var(--s3)', border: '1px solid var(--ln2)',
              borderRadius: 16, borderBottomLeftRadius: 4,
            }}
          >
            <Dots />
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px 12px',
        borderTop: '1px solid var(--ln)', background: 'var(--s1)',
        borderRadius: '0 0 20px 20px',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="e.g. Can I leave the cap on?"
          autoComplete="off"
          style={{
            flex: 1, background: 'var(--s3)', border: '1.5px solid var(--ln2)',
            borderRadius: 12, padding: '11px 13px', fontSize: 13.5, color: 'var(--tx)',
            outline: 'none', transition: 'border-color .2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--ac)'}
          onBlur={e => e.target.style.borderColor = 'var(--ln2)'}
        />
        <button
          onClick={handleSend}
          style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--ac), var(--acl))',
            color: '#fff', display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 14px var(--acg)',
            transition: 'opacity .15s, transform .1s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Send"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}
