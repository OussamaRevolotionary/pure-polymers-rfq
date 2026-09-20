import { useId, useRef } from 'react'
import { Check } from 'lucide-react'

export function FieldShell({ label, hint, error, htmlFor, required, children, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1.5 text-[0.8125rem] font-medium text-ink-200">
          {label}
          {required ? <span className="text-brand-lime" aria-hidden>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function TextField({ label, hint, error, required, className, multiline = false, ...inputProps }) {
  const id = useId()
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <Tag
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-required={required || undefined}
        className={`field-input ${multiline ? 'min-h-24 resize-y leading-relaxed' : ''}`}
        {...inputProps}
      />
    </FieldShell>
  )
}

export function SelectField({ label, hint, error, required, className, options, placeholder, value, onChange }) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <select
        id={id}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field-input"
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.id
          const text = typeof option === 'string' ? option : option.label
          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </select>
    </FieldShell>
  )
}

/** Pressable chip; `marker` renders a small dot (e.g. "documented for this product"). */
export function Chip({ selected, onClick, children, marker = false, disabled = false, title }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] transition duration-150 ${
        selected
          ? 'border-brand-lime/60 bg-brand-lime/15 text-white'
          : 'border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/25 hover:text-ink-100'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {selected ? <Check className="size-3.5 text-brand-lime" aria-hidden /> : null}
      {children}
      {marker && !selected ? <span className="size-1.5 rounded-full bg-brand-green" aria-hidden /> : null}
    </button>
  )
}

export function ChipGroup({ label, hint, error, options, value, multiple = false, onChange, markers = [], required }) {
  const labelId = useId()
  const selected = multiple ? (Array.isArray(value) ? value : []) : value
  const toggle = (optionValue) => {
    if (multiple) {
      onChange(selected.includes(optionValue) ? selected.filter((v) => v !== optionValue) : [...selected, optionValue])
    } else {
      onChange(selected === optionValue ? '' : optionValue)
    }
  }
  return (
    <div role="group" aria-labelledby={labelId}>
      {label ? (
        <p id={labelId} className="mb-2 flex items-baseline gap-1.5 text-[0.8125rem] font-medium text-ink-200">
          {label}
          {required ? <span className="text-brand-lime" aria-hidden>*</span> : null}
          {multiple ? <span className="text-xs font-normal text-ink-500">· select all that apply</span> : null}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.id
          const text = typeof option === 'string' ? option : option.label
          const isSelected = multiple ? selected.includes(optionValue) : selected === optionValue
          return (
            <Chip
              key={optionValue}
              selected={isSelected}
              onClick={() => toggle(optionValue)}
              marker={markers.includes(optionValue)}
            >
              {text}
            </Chip>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  )
}

/** Single-choice segmented control with roving focus (arrow keys). */
export function Segmented({ label, options, value, onChange, error, required, columns }) {
  const labelId = useId()
  const refs = useRef([])
  const items = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : { value: option.id, label: option.label },
  )
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  )
  const onKeyDown = (event, index) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = (index + delta + items.length) % items.length
    refs.current[next]?.focus()
    onChange(items[next].value)
  }
  return (
    <div>
      {label ? (
        <p id={labelId} className="mb-2 flex items-baseline gap-1.5 text-[0.8125rem] font-medium text-ink-200">
          {label}
          {required ? <span className="text-brand-lime" aria-hidden>*</span> : null}
        </p>
      ) : null}
      <div
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        className="grid gap-1.5 rounded-xl border border-white/10 bg-ink-900/60 p-1"
        style={{ gridTemplateColumns: `repeat(${columns ?? Math.min(items.length, 3)}, minmax(0, 1fr))` }}
      >
        {items.map((item, index) => {
          const checked = item.value === value
          return (
            <button
              key={item.value}
              ref={(el) => (refs.current[index] = el)}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => onChange(checked ? '' : item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`min-h-10 rounded-lg px-2.5 py-2 text-[0.8125rem] leading-tight transition ${
                checked
                  ? 'bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(190,204,48,0.55)]'
                  : 'text-ink-300 hover:bg-white/[0.05] hover:text-ink-100'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function Toggle({ label, description, checked, onChange }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-200">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs text-ink-400">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
          checked ? 'border-brand-green bg-brand-green' : 'border-white/15 bg-ink-700'
        }`}
      >
        <span
          className={`inline-block size-4.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

export function Slider({ label, min, max, step, unit, value, onChange, hint }) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-200">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-sm text-brand-lime">
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-brand-lime"
        style={{ background: `linear-gradient(90deg, #becc30 ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
      />
      <div className="mt-1 flex justify-between font-mono text-[0.6875rem] text-ink-500">
        <span>
          {min}
          {unit}
        </span>
        {hint ? <span className="text-ink-400">{hint}</span> : null}
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

export function ColorField({ label, value, onChange, hint }) {
  const id = useId()
  const hex = value || '#3249b3'
  return (
    <FieldShell label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border border-white/10 bg-ink-900 p-1"
        />
        <span className="font-mono text-sm text-ink-300 uppercase">{value ? hex : 'Not set'}</span>
      </div>
    </FieldShell>
  )
}
