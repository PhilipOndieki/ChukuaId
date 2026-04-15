import { useState } from 'react'

/**
 * ResultCard — displays the uncollected ID record after DOB verification.
 *
 * Privacy guarantees:
 *   - ID number is always displayed masked (XX****XXX format).
 *   - DOB is never shown.
 *   - The "Share result" text contains no sensitive data.
 *
 * Props:
 *   record  — { name, centre, county, address, phone, hours, idMasked }
 *             (returned by the verifyDob Cloud Function)
 *   onBack  — callback to start a new search
 */
export default function ResultCard({ record, onBack }) {
  const [copied, setCopied] = useState(false)

  const { name, centre, county, address, phone, hours, idMasked } = record

  function buildShareText() {
    return [
      `Chukua ID — ID Card Collection Notice`,
      ``,
      `Identity confirmed for ID: ${idMasked}`,
      ``,
      `Collection point: ${centre}`,
      `County: ${county}`,
      `Address: ${address}`,
      `Phone: ${phone}`,
      `Operating hours: ${hours}`,
      ``,
      `Visit the Huduma Centre during operating hours to collect your ID.`,
      `chukuaid.go.ke`,
    ].join('\n')
  }

  async function handleShare() {
    const text = buildShareText()

    if (navigator.share) {
      try {
        await navigator.share({ text, title: 'Chukua ID — Collection Notice' })
      } catch {
        // User cancelled share — no action needed
      }
      return
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Confirmed banner */}
      <div className="bg-green-500/20 border border-green-400/40 rounded-xl px-4 py-3 mb-4
        flex items-start gap-3">
        <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-300">Identity confirmed</p>
          <p className="text-base font-bold text-white mt-0.5">
            {name}
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Card header */}
        <div className="bg-primary px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              ID Number
            </p>
            <p className="text-xl font-bold text-white font-mono tracking-widest mt-0.5">
              {idMasked}
            </p>
          </div>
          <div className="bg-amber-400 rounded-full p-2" aria-hidden="true">
            <IdCardIcon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Card body */}
        <div className="px-5 py-4 space-y-3.5">
          <InfoRow label="Collection centre" value={centre} icon={<BuildingIcon />} />
          <InfoRow label="County" value={county} icon={<MapPinIcon />} />
          <InfoRow label="Physical address" value={address} icon={<LocationIcon />} />
          <InfoRow label="Phone number" value={phone} icon={<PhoneIcon />} />
          <InfoRow label="Operating hours" value={hours} icon={<ClockIcon />} />
        </div>

        {/* Card footer */}
        <div className="px-5 pb-5 pt-2 flex flex-col gap-2.5">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Bring this ID number and a valid supporting document (birth certificate,
              passport, or driving licence) when collecting your card.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 h-10 rounded-lg text-sm font-semibold text-gray-600
                border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              New search
            </button>
            <button
              onClick={handleShare}
              className="flex-[2] h-10 rounded-lg text-sm font-semibold text-white
                bg-primary hover:bg-primary-light transition-colors
                flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <ShareIcon className="w-4 h-4" />
                  Share result
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/8 flex items-center
        justify-center text-primary mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  )
}

// Icons
function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}
function IdCardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}
function BuildingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}
function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function ShareIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  )
}
