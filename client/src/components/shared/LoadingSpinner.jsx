/**
 * LoadingSpinner — accessible, CSS-only spinner.
 *
 * Props:
 *   size    — "sm" | "md" | "lg"
 *   color   — "white" | "green" | "amber"
 *   label   — Screen-reader text (default: "Loading…")
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'green',
  label = 'Loading…',
}) {
  const sizeMap = { sm: 'h-4 w-4 border-2', md: 'h-7 w-7 border-2', lg: 'h-10 w-10 border-[3px]' }
  const colorMap = {
    white: 'border-white/30 border-t-white',
    green: 'border-primary/20 border-t-primary',
    amber: 'border-amber-200 border-t-amber-500',
  }

  return (
    <span role="status" aria-label={label} className="inline-flex">
      <span
        className={`animate-spin rounded-full ${sizeMap[size]} ${colorMap[color]}`}
      />
    </span>
  )
}
