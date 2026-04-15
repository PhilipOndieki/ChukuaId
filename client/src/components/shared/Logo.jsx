/**
 * Logo — Chukua ID wordmark with an optional icon.
 *
 * Props:
 *   variant   — "light" (white, for hero) | "dark" (green, for admin)
 *   size      — "sm" | "md" | "lg"
 */
export default function Logo({ variant = 'light', size = 'md' }) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-xl', sub: 'text-xs' },
    md: { icon: 40, text: 'text-3xl', sub: 'text-sm' },
    lg: { icon: 52, text: 'text-4xl', sub: 'text-base' },
  }

  const { icon, text, sub } = sizeMap[size] || sizeMap.md
  const isLight = variant === 'light'

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Icon: stylised ID card */}
      <div
        className={`flex items-center justify-center rounded-xl
          ${isLight ? 'bg-white/15 border border-white/30' : 'bg-primary/10 border border-primary/30'}`}
        style={{ width: icon * 1.7, height: icon * 1.1 }}
        aria-hidden="true"
      >
        <svg
          width={icon}
          height={icon * 0.65}
          viewBox="0 0 40 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Card body */}
          <rect
            x="1" y="1" width="38" height="24" rx="3"
            stroke={isLight ? 'white' : '#0A4A2E'}
            strokeWidth="2"
            fill="none"
          />
          {/* Photo placeholder */}
          <rect
            x="4" y="4" width="8" height="10" rx="1"
            fill={isLight ? 'rgba(255,255,255,0.4)' : 'rgba(10,74,46,0.3)'}
          />
          {/* Lines */}
          <rect x="15" y="5" width="18" height="2" rx="1" fill={isLight ? 'rgba(255,255,255,0.7)' : 'rgba(10,74,46,0.6)'} />
          <rect x="15" y="9" width="12" height="2" rx="1" fill={isLight ? 'rgba(255,255,255,0.5)' : 'rgba(10,74,46,0.4)'} />
          <rect x="15" y="13" width="15" height="2" rx="1" fill={isLight ? 'rgba(255,255,255,0.5)' : 'rgba(10,74,46,0.4)'} />
          {/* Bottom bar */}
          <rect x="4" y="18" width="32" height="3" rx="1" fill={isLight ? 'rgba(245,158,11,0.8)' : 'rgba(245,158,11,0.7)'} />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="text-center leading-none">
        <span
          className={`font-bold tracking-tight ${text}
            ${isLight ? 'text-white' : 'text-primary'}`}
        >
          Chukua
          <span className={isLight ? 'text-amber-400' : 'text-amber-500'}>ID</span>
        </span>
      </div>

      {/* Tagline — shown only at md+ sizes */}
      {size !== 'sm' && (
        <p className={`font-medium tracking-wide ${sub}
          ${isLight ? 'text-white/75' : 'text-gray-500'}`}
        >
          Collect your national ID card
        </p>
      )}
    </div>
  )
}
