import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, RotateCcw, Sparkles, X } from 'lucide-react'
import { createAssistantSession } from '../../lib/assistant/session.js'
import { TOOL } from '../../lib/assistant/tools.js'
import { readJSON, writeJSON } from '../../lib/storage.js'
import { LogoMark } from '../layout/Brand.jsx'
import ActionCards from './ActionCards.jsx'
import RichText from './RichText.jsx'

const UI_KEY = 'pp.assistant.ui.v1'
const NUDGE_KEY = 'pp.assistant.nudged'

const GREETING = {
  id: 'greeting',
  role: 'assistant',
  text: "Hi — I'm the Pure Polymers technical assistant. Ask me about grades, dosage or a processing defect, and I'll recommend a solution and set up your quote.",
  actions: [],
}

const SUGGESTIONS = [
  'Fish-eyes in recycled LLDPE film — what fixes it?',
  'Anti-fog dosage for greenhouse film',
  'High-TiO₂ white for PP injection molding',
  'I want to talk to sales on WhatsApp',
]

const newId = () => Math.random().toString(36).slice(2, 10)

function TypingPellets() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2" aria-label="Assistant is typing" role="status">
      {['#F2F4F7', '#3249B3', '#E09A2D'].map((color, i) => (
        <motion.span
          key={color}
          className="h-2.5 w-3 rounded-[40%]"
          style={{ background: color }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function AssistantWidget({
  open,
  onOpenChange,
  draft,
  onDraftConsumed,
  onPrefill,
  onReviewForm,
  onAddProduct,
  selectedIds,
  language,
  suppressNudge = false,
}) {
  const sessionRef = useRef(null)
  if (!sessionRef.current) sessionRef.current = createAssistantSession()
  const session = sessionRef.current

  const [messages, setMessages] = useState(() => {
    const saved = readJSON(UI_KEY, null, 'session')
    return Array.isArray(saved) && saved.length ? saved : [GREETING]
  })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [nudge, setNudge] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    writeJSON(UI_KEY, messages.slice(-40), 'session')
  }, [messages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && onOpenChange(false)
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open && draft) {
      setInput(draft)
      onDraftConsumed()
      requestAnimationFrame(() => {
        const el = inputRef.current
        if (el) {
          el.focus()
          el.setSelectionRange(el.value.length, el.value.length)
        }
      })
    }
  }, [open, draft, onDraftConsumed])

  useEffect(() => {
    if (readJSON(NUDGE_KEY, false, 'session')) return undefined
    const id = setTimeout(() => {
      setNudge(true)
      writeJSON(NUDGE_KEY, true, 'session')
    }, 9000)
    return () => clearTimeout(id)
  }, [])

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      setMessages((list) => [...list, { id: newId(), role: 'user', text: trimmed }])
      setInput('')
      setBusy(true)
      try {
        const result = await session.send(trimmed, { language })
        const actions = result.actions ?? []
        setMessages((list) => [...list, { id: newId(), role: 'assistant', text: result.reply, actions, degraded: result.degraded }])
        // Conversion routing: a qualified buyer is pushed straight into the prefilled form.
        const formAction = actions.find((action) => action.type === TOOL.OPEN_QUOTE_FORM)
        if (formAction) onPrefill(formAction.input)
      } catch {
        setMessages((list) => [
          ...list,
          {
            id: newId(),
            role: 'assistant',
            text: 'Sorry — I could not reach the assistant just now. You can still submit the quote form, or message the sales desk directly.',
            actions: [
              {
                id: newId(),
                type: TOOL.HANDOFF_TO_WHATSAPP,
                input: { reason: 'user_requested', urgency: 'normal', message: `Hello Pure Polymers, my question: ${trimmed}`, language: 'en' },
              },
            ],
          },
        ])
      } finally {
        setBusy(false)
      }
    },
    [busy, session, language, onPrefill],
  )

  const reset = () => {
    session.reset()
    setMessages([GREETING])
  }

  const onSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  const showSuggestions = messages.length <= 1 && !busy

  return (
    <div className="no-print">
      <AnimatePresence>
        {!open ? (
          <motion.div
            key="launcher"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6"
          >
            <AnimatePresence>
              {nudge && !suppressNudge ? (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="glass-strong relative max-w-[16rem] rounded-2xl rounded-br-md px-4 py-3 text-sm text-ink-200"
                >
                  Not sure which additive solves your defect? Describe it — I’ll recommend a grade.
                  <button
                    type="button"
                    onClick={() => setNudge(false)}
                    className="absolute top-1.5 right-1.5 rounded-full p-1 text-ink-500 hover:text-white"
                    aria-label="Dismiss"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => {
                setNudge(false)
                onOpenChange(true)
              }}
              className="group glass-strong flex h-14 items-center gap-3 rounded-full py-2 pr-5 pl-2 text-left shadow-[0_18px_50px_-12px_rgba(50,73,179,0.65)] transition hover:border-brand-blue/50"
            >
              <span className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-green">
                <Sparkles className="size-[1.125rem] text-white" aria-hidden />
                <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-ink-900 bg-brand-lime" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-white">Ask a polymer specialist</span>
                <span className="text-[0.6875rem] text-ink-400">AI · English &amp; العربية</span>
              </span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Pure Polymers technical assistant"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[min(680px,calc(100dvh-6rem))] sm:w-[25rem] sm:rounded-3xl"
          >
            <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
              <LogoMark className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">Technical assistant</p>
                <p className="flex items-center gap-1.5 truncate text-[0.6875rem] text-ink-400">
                  <span className={`size-1.5 rounded-full ${session.mode === 'live' ? 'bg-brand-green' : 'bg-amber'}`} />
                  {session.mode === 'live' ? 'Catalog-grounded · answers from the Pure Polymers TDS library' : 'Preview engine · connect the backend to go live'}
                </p>
              </div>
              <button type="button" onClick={reset} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/5 hover:text-white" aria-label="Start a new conversation">
                <RotateCcw className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg p-2 text-ink-400 transition hover:bg-white/5 hover:text-white" aria-label="Close assistant">
                <X className="size-4" aria-hidden />
              </button>
            </header>

            <div ref={listRef} className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-green/25 px-3.5 py-2.5 text-[0.875rem] leading-relaxed whitespace-pre-line text-white" dir="auto">
                      {message.text}
                    </p>
                  </div>
                ) : (
                  <div key={message.id} className="max-w-[92%]">
                    <div className="rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-[0.875rem] leading-relaxed text-ink-200">
                      <RichText text={message.text} />
                    </div>
                    <ActionCards
                      actions={message.actions}
                      selectedIds={selectedIds}
                      onAddProduct={onAddProduct}
                      onOpenForm={(prefill) => {
                        onReviewForm(prefill)
                        if (window.matchMedia('(max-width: 639px)').matches) onOpenChange(false)
                      }}
                    />
                    {message.degraded ? <p className="mt-1.5 text-[0.6875rem] text-ink-500">Answered by the offline engine (live assistant unreachable).</p> : null}
                  </div>
                ),
              )}
              {busy ? <TypingPellets /> : null}
              {showSuggestions ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-ink-300 transition hover:border-brand-lime/50 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="border-t border-white/[0.07] p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-ink-950/70 p-1.5 focus-within:border-brand-lime/50">
                <label htmlFor="assistant-input" className="sr-only">
                  Message the technical assistant
                </label>
                <textarea
                  id="assistant-input"
                  ref={inputRef}
                  rows={1}
                  dir="auto"
                  value={input}
                  maxLength={2000}
                  onChange={(event) => {
                    setInput(event.target.value)
                    event.target.style.height = 'auto'
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault()
                      send(input)
                    }
                  }}
                  placeholder="Describe your product, polymer or defect…"
                  className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[0.875rem] text-white placeholder:text-ink-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="flex size-9 items-center justify-center rounded-xl bg-brand-green text-white transition hover:bg-brand-green-light disabled:bg-ink-700 disabled:text-ink-500"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
              </div>
              <p className="mt-2 px-1 text-[0.625rem] leading-snug text-ink-500">
                Answers come from the Pure Polymers catalog. Prices, certifications and final dosages are confirmed by the sales team.
              </p>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
