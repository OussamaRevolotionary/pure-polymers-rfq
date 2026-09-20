import { forwardRef, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Send, Sparkles, X } from 'lucide-react'
import { STEPS } from '../../state/quoteState.js'
import { firstInvalidStep, validateStep } from '../../lib/validation.js'
import Button from '../ui/Button.jsx'
import InquiryBrief from './InquiryBrief.jsx'
import Stepper from './Stepper.jsx'
import ContactStep from './steps/ContactStep.jsx'
import ProductStep from './steps/ProductStep.jsx'
import SpecsStep from './steps/SpecsStep.jsx'
import VolumeStep from './steps/VolumeStep.jsx'

const STEP_COMPONENTS = [ProductStep, SpecsStep, VolumeStep, ContactStep]

const QuoteConfigurator = forwardRef(function QuoteConfigurator(
  { state, dispatch, submitting, submitError, onSubmit, onAskAssistant, onDismissPrefill },
  ref,
) {
  const headingRef = useRef(null)
  const panelRef = useRef(null)
  const firstRender = useRef(true)
  const errors = validateStep(state.step, state)
  const showErrors = Boolean(state.attempted[state.step])
  const invalidAt = firstInvalidStep(state)
  const maxReachable = invalidAt === -1 ? STEPS.length - 1 : invalidAt
  const StepComponent = STEP_COMPONENTS[state.step]
  const isLast = state.step === STEPS.length - 1

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const top = panelRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    headingRef.current?.focus({ preventScroll: true })
  }, [state.step])

  const goNext = () => {
    if (Object.keys(errors).length) {
      dispatch({ type: 'attempt', step: state.step })
      requestAnimationFrame(() => {
        panelRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return
    }
    if (isLast) onSubmit()
    else dispatch({ type: 'goto', step: state.step + 1 })
  }

  return (
    <section ref={ref} id="configurator" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8" aria-label="Quote configurator">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div ref={panelRef} className="glass-strong min-w-0 scroll-mt-20 rounded-3xl lg:col-span-8">
          <div className="border-b border-white/[0.07] px-5 pt-5 pb-4 sm:px-7">
            <Stepper step={state.step} maxReachable={maxReachable} onGoto={(step) => dispatch({ type: 'goto', step })} />
          </div>

          {state.prefilledBy === 'assistant' && !state.prefillBannerDismissed ? (
            <div className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-brand-blue/40 bg-brand-blue/10 px-4 py-3 text-sm sm:mx-7">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-blue-light" aria-hidden />
              <p className="flex-1 text-ink-200">
                Prefilled by the assistant from your conversation. Review each step — nothing is sent until you submit.
              </p>
              <button type="button" onClick={onDismissPrefill} className="rounded-full p-1 text-ink-400 hover:text-white" aria-label="Dismiss">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="px-5 pt-6 pb-2 sm:px-7">
            <p className="eyebrow">
              Step {state.step + 1} · {STEPS[state.step].caption}
            </p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-1.5 font-display text-2xl font-medium text-white focus:outline-none sm:text-[1.75rem]">
              {STEP_HEADLINES[state.step]}
            </h2>
          </div>

          <div className="relative px-5 py-5 sm:px-7">
            {/* popLayout: the next step mounts immediately; the animation never gates content. */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={state.step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <StepComponent state={state} dispatch={dispatch} errors={errors} showErrors={showErrors} onAskAssistant={onAskAssistant} />
              </motion.div>
            </AnimatePresence>
          </div>

          {submitError ? (
            <p role="alert" className="mx-5 mb-2 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200 sm:mx-7">
              {submitError}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:px-7">
            <Button
              variant="ghost"
              icon={ArrowLeft}
              onClick={() => dispatch({ type: 'goto', step: state.step - 1 })}
              className={state.step === 0 ? 'invisible' : ''}
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              {showErrors && Object.keys(errors).length ? (
                <span className="hidden text-xs text-red-300 sm:inline">
                  {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? 's' : ''} need attention
                </span>
              ) : null}
              <Button onClick={goNext} loading={submitting} iconRight={isLast ? Send : ArrowRight} size="md">
                {isLast ? (
                  submitting ? (
                    'Logging your inquiry…'
                  ) : (
                    <>
                      <span className="sm:hidden">Submit inquiry</span>
                      <span className="hidden sm:inline">Submit technical inquiry</span>
                    </>
                  )
                ) : (
                  <>
                    <span className="sm:hidden">Continue</span>
                    <span className="hidden sm:inline">Continue to {STEPS[state.step + 1].title.toLowerCase()}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden lg:col-span-4 lg:block">
          <InquiryBrief state={state} />
        </div>
      </div>
    </section>
  )
})

const STEP_HEADLINES = [
  'Which product line do you need?',
  'Tell us the technical requirement.',
  'How much, how soon, and where?',
  'Where should we send your quotation?',
]

export default QuoteConfigurator
