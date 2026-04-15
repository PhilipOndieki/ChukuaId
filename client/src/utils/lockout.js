/**
 * Client-side brute-force lockout for the DOB verification step.
 *
 * Stores attempt counts and lockout timestamps in localStorage, keyed by
 * the ID number so lockouts are per-record. The server-side Cloud Function
 * is the authoritative guard; this is an additional UX-level protection.
 *
 * Rules:
 *   - Maximum 3 failed attempts before a 10-minute lockout.
 *   - Lockout resets automatically after 10 minutes.
 *   - Successful verification clears the counter.
 */

const MAX_ATTEMPTS = 3
const LOCKOUT_MS = 10 * 60 * 1000 // 10 minutes

function storageKey(idNumber) {
  return `chukuaid_lockout_${idNumber}`
}

export function getLockoutState(idNumber) {
  try {
    const raw = localStorage.getItem(storageKey(idNumber))
    if (!raw) return { locked: false, attempts: 0, remainingMs: 0 }

    const state = JSON.parse(raw)
    const now = Date.now()

    if (state.lockedAt) {
      const elapsed = now - state.lockedAt
      if (elapsed < LOCKOUT_MS) {
        return {
          locked: true,
          attempts: state.attempts,
          remainingMs: LOCKOUT_MS - elapsed,
        }
      }
      // Lockout expired — clear it
      localStorage.removeItem(storageKey(idNumber))
      return { locked: false, attempts: 0, remainingMs: 0 }
    }

    return { locked: false, attempts: state.attempts || 0, remainingMs: 0 }
  } catch {
    return { locked: false, attempts: 0, remainingMs: 0 }
  }
}

export function recordFailedAttempt(idNumber) {
  try {
    const current = getLockoutState(idNumber)
    const attempts = current.attempts + 1

    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(
        storageKey(idNumber),
        JSON.stringify({ attempts, lockedAt: Date.now() })
      )
      return { locked: true, attempts, remainingMs: LOCKOUT_MS }
    }

    localStorage.setItem(storageKey(idNumber), JSON.stringify({ attempts }))
    return { locked: false, attempts, remainingMs: 0 }
  } catch {
    return { locked: false, attempts: 1, remainingMs: 0 }
  }
}

export function clearLockout(idNumber) {
  try {
    localStorage.removeItem(storageKey(idNumber))
  } catch {
    // Storage may be unavailable in private browsing — silently ignore
  }
}

/** Returns remaining lockout time as a human-readable string, e.g. "8 min 23 sec" */
export function formatRemainingTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) return `${minutes} min ${seconds} sec`
  return `${seconds} sec`
}
