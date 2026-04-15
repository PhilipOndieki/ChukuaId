import { useState } from 'react'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * SubscribeForm — shown when an ID is not found in the database.
 *
 * Allows users to subscribe with a phone number or email. When an official
 * later adds the ID, a Cloud Function sends them an SMS/email alert.
 *
 * Props:
 *   idNumber — the searched ID number (used as Firestore document ID)
 *   onBack   — callback to start a new search
 */
export default function SubscribeForm({ idNumber, onBack }) {
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function isKenyanPhone(v) { return /^(\+2547\d{8}|07\d{8})$/.test(v) }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

  function validate(val) {
    if (!val.trim()) return 'Please enter a phone number or email address.'
    if (!isKenyanPhone(val.trim()) && !isEmail(val.trim())) {
      return 'Enter a valid Kenyan mobile number (07XXXXXXXX) or email address.'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = contact.trim()
    const err = validate(trimmed)
    if (err) { setError(err); return }

    setError('')
    setLoading(true)

    try {
      const subRef = doc(db, 'subscribers', idNumber)
      const subSnap = await getDoc(subRef)

      if (subSnap.exists()) {
        // Append to existing contacts list
        await updateDoc(subRef, {
          contacts: arrayUnion(trimmed),
        })
      } else {
        // Create new subscriber document
        await setDoc(subRef, {
          idNumber,
          contacts: [trimmed],
          createdAt: serverTimestamp(),
        })
      }

      setSuccess(true)
    } catch {
      setError('Unable to save your subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-8">
          <div className="w-14 h-14 rounded-full bg-amber-400/20 border-2 border-amber-400/50
            flex items-center justify-center mx-auto mb-4">
            <BellIcon className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">You're subscribed!</h3>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            We'll send you an alert when ID{' '}
            <span className="font-mono font-semibold text-white/90">{idNumber}</span>{' '}
            becomes available for collection at a Huduma Centre.
          </p>
          <button
            onClick={onBack}
            className="w-full h-11 rounded-lg font-semibold text-white text-sm
              bg-primary hover:bg-primary-light border border-white/20
              transition-colors"
          >
            Search another ID
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Not found notice */}
      <div className="flex items-start gap-2.5 mb-4 bg-gray-900/40 border border-white/15
        rounded-lg px-4 py-3">
        <InfoIcon className="w-4 h-4 text-white/60 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-white/70 leading-snug">
          ID number{' '}
          <span className="font-mono font-semibold text-white/90">{idNumber}</span>{' '}
          is not yet registered at any Huduma Centre. Subscribe below to receive
          an alert when it becomes available.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
        noValidate
        aria-label="Subscribe for ID alert"
      >
        <div>
          <label
            htmlFor="contact-input"
            className="block text-sm font-semibold text-white/90 mb-1.5"
          >
            Phone number or email
          </label>
          <input
            id="contact-input"
            type="text"
            value={contact}
            onChange={(e) => { setContact(e.target.value); setError('') }}
            placeholder="07XXXXXXXX or you@example.com"
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? 'subscribe-error' : undefined}
            className="w-full h-12 px-4 rounded-lg bg-white text-gray-900 placeholder-gray-400
              text-base border-2 border-transparent
              focus:border-amber-400 focus:outline-none
              disabled:opacity-60 transition-colors"
          />
          <p className="mt-1 text-xs text-white/45">
            Kenyan mobile number (07XXXXXXXX or +2547XXXXXXXX) or any email address.
          </p>
        </div>

        {error && (
          <p
            id="subscribe-error"
            role="alert"
            className="text-sm text-red-300 font-medium"
          >
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 h-11 rounded-lg font-semibold text-white/80 text-sm
              border border-white/25 hover:bg-white/10 transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading || !contact}
            className="flex-[2] h-11 rounded-lg font-semibold text-white text-sm
              bg-amber-500 hover:bg-amber-400 active:bg-amber-600
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" label="Subscribing…" />
                Subscribing…
              </>
            ) : (
              <>
                <BellIcon className="w-4 h-4" />
                Notify me
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}
