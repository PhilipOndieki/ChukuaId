export default function Footer({ onAdminClick }) {
  return (
    <footer className="absolute bottom-0 inset-x-0 flex items-center justify-center py-4 z-20">
      <div className="flex items-center gap-4">
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

        <span className="text-white/20 text-xs">·</span>

        <a
          href="https://philip2.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200
            focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-4
            rounded px-1"
        >
          Designed by Philip
        </a>
      </div>
    </footer>
  )
}