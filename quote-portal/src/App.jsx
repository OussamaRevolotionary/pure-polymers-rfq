import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import AssistantWidget from './components/assistant/AssistantWidget.jsx'
import Confirmation from './components/confirmation/Confirmation.jsx'
import Footer from './components/layout/Footer.jsx'
import Header from './components/layout/Header.jsx'
import Hero from './components/layout/Hero.jsx'
import QuoteConfigurator from './components/quote/QuoteConfigurator.jsx'
import { PRODUCT_BY_ID, familyCodeFor } from './data/catalog.js'
import { deskStatus as computeDeskStatus } from './lib/businessTime.js'
import { buildPayload } from './lib/payload.js'
import { generateReference, uuid } from './lib/reference.js'
import { flushOutbox, submitQuote } from './lib/submission.js'
import { buildSummary } from './lib/summary.js'
import PelletField from './three/PelletField.jsx'
import { initialQuoteState, quoteReducer } from './state/quoteState.js'

function useDeskStatus() {
  const [status, setStatus] = useState(() => computeDeskStatus())
  useEffect(() => {
    const id = setInterval(() => setStatus(computeDeskStatus()), 60_000)
    return () => clearInterval(id)
  }, [])
  return status
}

export default function App() {
  const [quote, dispatch] = useReducer(quoteReducer, initialQuoteState)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantDraft, setAssistantDraft] = useState('')
  const configuratorRef = useRef(null)
  const deskStatus = useDeskStatus()

  useEffect(() => {
    flushOutbox()
    const onOnline = () => flushOutbox()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  const scrollToConfigurator = useCallback(() => {
    requestAnimationFrame(() => configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])

  const askAssistant = useCallback((draft = '') => {
    setAssistantDraft(typeof draft === 'string' ? draft : '')
    setAssistantOpen(true)
  }, [])

  /** open_quote_form from the agent: prefill (starting a fresh inquiry if one was just submitted). */
  const applyPrefill = useCallback(
    (prefill) => {
      if (result) {
        setResult(null)
        dispatch({ type: 'restart' })
      }
      dispatch({ type: 'prefill', prefill })
    },
    [result],
  )

  const reviewForm = useCallback(
    (prefill) => {
      applyPrefill(prefill)
      scrollToConfigurator()
    },
    [applyPrefill, scrollToConfigurator],
  )

  const addProductFromAssistant = useCallback(
    (productId) => {
      if (result) {
        setResult(null)
        dispatch({ type: 'restart' })
      }
      if (!quote.productIds.includes(productId)) dispatch({ type: 'toggleProduct', productId })
    },
    [quote.productIds, result],
  )

  const handleSubmit = async () => {
    setSubmitError('')
    setSubmitting(true)
    const submittedAt = new Date().toISOString()
    const reference = generateReference(familyCodeFor(quote.productIds))
    const payload = buildPayload(quote, { reference, submissionId: uuid(), submittedAt })
    try {
      const outcome = await submitQuote(payload)
      setResult({
        reference,
        submittedAt,
        status: outcome.status,
        summary: buildSummary(quote),
        productIds: quote.productIds,
        sampleRequested: quote.commercial.sampleRequested,
        email: payload.contact.email,
        company: payload.contact.company,
        firstName: payload.contact.firstName,
      })
      if (outcome.status !== 'rejected') setPulseKey((key) => key + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setSubmitError('Something went wrong while preparing your inquiry. Please try again or message us on WhatsApp.')
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setResult(null)
    dispatch({ type: 'restart' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const emphasis = result ? PRODUCT_BY_ID[result.productIds[0]].family : quote.familyId

  return (
    <>
      <PelletField emphasis={emphasis} pulseKey={pulseKey} />
      <a href="#configurator" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-ink-950">
        Skip to quote form
      </a>
      <Header deskStatus={deskStatus} />
      <main className="relative">
        {result ? (
          <Confirmation result={result} onRestart={restart} onAskAssistant={askAssistant} />
        ) : (
          <>
            <Hero deskStatus={deskStatus} onStart={scrollToConfigurator} onAskAssistant={() => askAssistant()} />
            <QuoteConfigurator
              ref={configuratorRef}
              state={quote}
              dispatch={dispatch}
              submitting={submitting}
              submitError={submitError}
              onSubmit={handleSubmit}
              onAskAssistant={askAssistant}
              onDismissPrefill={() => dispatch({ type: 'dismissPrefillBanner' })}
            />
          </>
        )}
      </main>
      <Footer />
      <AssistantWidget
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        draft={assistantDraft}
        onDraftConsumed={() => setAssistantDraft('')}
        onPrefill={applyPrefill}
        onReviewForm={reviewForm}
        onAddProduct={addProductFromAssistant}
        selectedIds={quote.productIds}
        language={quote.contact.language}
        suppressNudge={Boolean(result)}
      />
    </>
  )
}
