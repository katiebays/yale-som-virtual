import { Fragment, useEffect, useRef, useState } from 'react'
import { API_BASE, PROF_INFO } from './talk.js'

// one id per page load so each professor remembers the conversation on the backend
const SESSION_ID = crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`

// tiny formatter: keep line breaks, render **bold**
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>,
  )
}

export default function ChatWindow({ profId, onClose }) {
  const info = PROF_INFO[profId]
  const [messages, setMessages] = useState(() => [{ role: 'prof', text: info.greeting }])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef()
  const inputRef = useRef()

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (text) => {
    const message = text.trim()
    if (!message || busy) return
    setError('')
    setDraft('')
    setMessages((m) => [...m, { role: 'me', text: message }])
    setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professor_id: profId, session_id: SESSION_ID, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || `Server error (${res.status})`)
      setMessages((m) => [...m, { role: 'prof', text: data.reply }])
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? "Can't reach the professor backend. Is it running on port 8000?" : e.message)
      setDraft(message) // give the question back so it can be resent
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  return (
    <aside className="chat" role="dialog" aria-label={`Chat with ${info.name}`} onKeyDown={(e) => e.key === 'Escape' && onClose(false)}>
      <header className="chat-head">
        <div>
          <div className="chat-name">{info.name}</div>
          <div className="chat-course">{info.course} · Evans {info.room}</div>
        </div>
        <button className="chat-close" onClick={() => onClose(true)} aria-label="Close chat and keep walking">
          ✕
        </button>
      </header>
      <div className="chat-list" ref={listRef} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <Rich text={m.text} />
          </div>
        ))}
        {busy && (
          <div className="bubble prof typing" aria-label={`${info.name} is typing`}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message {info.name}
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about stats, AI, or any SOM class…"
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
    </aside>
  )
}
