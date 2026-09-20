export function LogoMark({ className = 'size-9' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}favicon.png`}
      alt=""
      width="36"
      height="36"
      className={`${className} rounded-md bg-white p-0.5`}
    />
  )
}

export function Wordmark() {
  return (
    <span className="flex flex-col leading-none whitespace-nowrap">
      <span className="font-display text-[1.15rem] font-medium tracking-tight text-white">Pure Polymers</span>
      <span className="mt-1 text-[0.625rem] font-semibold tracking-[0.08em] text-brand-lime italic">Real Passion for Quality</span>
    </span>
  )
}

/** CSS pellet swatch used on family tiles (mirrors the WebGL palette). */
export function PelletSwatch({ family, className = '' }) {
  const fills = {
    color: ['#3249B3', '#E09A2D', '#509C35'],
    white: ['#F2F4F7', '#F2F4F7', '#E6E9EE'],
    black: ['#16191E', '#0B0D11', '#20242B'],
    additive: ['#E09A2D', '#E6DCC4', '#F2F4F7'],
    compound: ['#3249B3', '#F2F4F7', '#0B0D11'],
  }[family] ?? ['#3249B3', '#E09A2D', '#F2F4F7']
  return (
    <span className={`relative inline-flex h-9 w-14 ${className}`} aria-hidden>
      {fills.map((fill, index) => (
        <span
          key={index}
          className="absolute h-5 w-6 rounded-[40%] shadow-[inset_-2px_-3px_6px_rgba(0,0,0,0.35),inset_2px_2px_4px_rgba(255,255,255,0.35),0_6px_12px_-4px_rgba(0,0,0,0.6)]"
          style={{
            background: fill,
            left: `${index * 14}px`,
            top: `${index % 2 ? 12 : 2}px`,
            transform: `rotate(${index * 28 - 20}deg)`,
          }}
        />
      ))}
    </span>
  )
}
