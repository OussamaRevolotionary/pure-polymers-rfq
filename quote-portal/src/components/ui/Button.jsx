import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-brand-green text-white hover:bg-brand-green-light shadow-[0_14px_34px_-14px_rgba(80,156,53,0.9)] disabled:bg-ink-600 disabled:shadow-none',
  secondary: 'glass text-ink-100 hover:border-white/20 hover:bg-white/[0.07]',
  ghost: 'text-ink-300 hover:bg-white/5 hover:text-white',
  whatsapp: 'bg-[#1ea952] text-white hover:bg-[#22bf5d] shadow-[0_14px_34px_-14px_rgba(30,169,82,0.9)]',
  amber: 'bg-amber text-ink-950 hover:bg-amber-light shadow-[0_14px_34px_-14px_rgba(224,154,45,0.9)]',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[0.9375rem] gap-2 rounded-xl',
  lg: 'h-13 px-6 text-base gap-2.5 rounded-xl',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  wrap = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  ...rest
}) {
  const isButton = Tag === 'button'
  const sizing = wrap ? `${SIZES[size].replace(/\bh-\d+\b/, 'min-h-11 py-2')} whitespace-normal text-center` : `${SIZES[size]} whitespace-nowrap`
  return (
    <Tag
      {...(isButton ? { type: rest.type ?? 'button' } : {})}
      {...rest}
      disabled={isButton ? rest.disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center font-medium transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${sizing} ${className}`}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="size-4" aria-hidden /> : null}
    </Tag>
  )
}
