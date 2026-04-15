/**
 * Footer — minimal footer on the public landing page.
 *
 * Contains only the discreet "Official access" link that opens the admin
 * login modal. No other links or content.
 *
 * Props:
 *   onAdminClick — callback to open the admin modal
 */
export default function Footer({ onAdminClick }) {
  return (
    <footer className="absolute bottom-0 inset-x-0 flex items-center justify-center py-4 z-20">
      <button
        onClick={onAdminClick}
        className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200
          underline underline-offset-2 decoration-white/20 hover:decoration-white/50
          focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-4
          rounded px-1"
        aria-label="Open official admin login"
      >
        Official access
      </button>
    </footer>
  )
}
