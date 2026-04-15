import { useState, useEffect, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { maskIdNumber } from '../../utils/maskId'
import {
  getLockoutState,
  recordFailedAttempt,
  clearLockout,
  formatRemainingTime,
} from '../../utils/lockout'
import LoadingSpinner from '../shared/LoadingSpinner'

async function hashDob(dob) {
  const encoder = new TextEncoder()
  const data = encoder.encode(dob + 'chukuaid_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function VerifyForm({ idNumber, onVerified, onBack }) {
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lockout, setLockout] = useState({ locked: false, remainingMs: 0, attempts: 0 })
  const [countdown, setCountdown] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const state = getLockoutState(idNumber)
    setLockout(state)
  }, [idNumber])

  useEffect(() => {
    if (!lockout.locked) {
      clearInterval(timerRef.current)
      setCountdown('')
      return
    }

    function tick() {
      const state = getLockoutState(idNumber)
      if (!state.locked) {
        setLockout({ locked: false, attempts: 0, remainingMs: 0 })
        clearInterval(timerRef.current)
        setCountdown('')
        setError('')
      } else {
        setCountdown(formatRemainingTime(state.remainingMs))
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [lockout.locked, idNumber])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!dob) { setError('Please enter your date of birth.'); return }

    const state = getLockoutState(idNumber)
    if (state.locked) return

    setError('')
    setLoading(true)

    try {
      const hashedInput = await hashDob(dob)
      const docSnap = await getDoc(doc(db, 'ids', idNumber))

      if (docSnap.exists() && docSnap.data().dob === hashedInput) {
        clearLockout(idNumber)
        const data = docSnap.data()
        onVerified({
          name: data.name,
          centre: data.centre,
          county: data.county,
          address: data.address,
          phone: data.phone,
          hours: data.hours,
          idMasked: maskIdNumber(idNumber),
        })
      } else {
        const newState = recordFailedAttempt(idNumber)
        setLockout(newState)

        if (newState.locked) {
          setError(
            `Too many failed attempts. Please wait ${formatRemainingTime(newState.remainingMs)} and try again.`
          )
        } else {
          const remaining = 3 - newState.attempts
          setError(
            `Details do not match. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          )
        }
      }
    } catch {
      setError('Unable to verify at this time. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const attemptsUsed = lockout.attempts
  const attemptsLeft = Math.max(0, 3 - attemptsUsed)

  return (
    <div className="w-full max-w-md mx-auto animate-in">
      <div className="flex items-center gap-2 mb-4 bg-green-500/20 border border-green-400/40
        rounded-lg px-4 py-2.5">
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-sm text-green-200 font-medium">
          ID found — please verify your identity to view details
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
        noValidate
        aria-label="Verify your date of birth"
      >
        <div>
          <label
            htmlFor="dob-input"
            className="block text-sm font-semibold text-white/90 mb-1.5"
          >
            Date of birth
          </label>
          <input
            id="dob-input"
            type="date"
            value={dob}
            onChange={(e) => { setDob(e.target.value); setError('') }}
            disabled={loading || lockout.locked}
            max={new Date().toISOString().split('T')[0]}
            aria-invalid={!!error}
            aria-describedby={error ? 'verify-error' : undefined}
            className="w-full h-12 px-4 rounded-lg bg-white text-gray-900
              text-base border-2 border-transparent
              focus:border-amber-400 focus:outline-none
              disabled:opacity-50 transition-colors"
          />
          <p className="mt-1 text-xs text-white/50">
            Enter the date of birth on your national ID card
          </p>
        </div>

        {error && (
          <p
            id="verify-error"
            role="alert"
            className="text-sm text-red-300 font-medium bg-red-900/30 border border-red-500/30
              rounded-lg px-3 py-2"
          >
            {error}
            {lockout.locked && countdown && (
              <span className="block mt-0.5 font-bold">{countdown} remaining</span>
            )}
          </p>
        )}

        {!lockout.locked && attemptsUsed > 0 && (
          <p className="text-xs text-white/50 text-right">
            {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 h-11 rounded-lg font-semibold text-white/80 text-sm
              border border-white/25 hover:bg-white/10 transition-colors"
          >
            ← New search
          </button>
          <button
            type="submit"
            disabled={loading || lockout.locked || !dob}
            className="flex-[2] h-11 rounded-lg font-semibold text-white text-sm
              bg-amber-500 hover:bg-amber-400 active:bg-amber-600
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" label="Verifying…" />
                Verifying…
              </>
            ) : (
              'Verify & View Details'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}