import { useState, useEffect, useRef } from 'react'
import Logo from '../shared/Logo'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * AdminLoginModal — overlaid on the landing page via the /admin route.
 *
 * Validates credentials via Firebase Auth (handled by the parent).
 * Checks the admins collection for an authorised user after sign-in.
 * If no admin document exists, the parent signs the user out and passes
 * an error message back here via the `authError` prop.
 *
 * Props:
 *   onLogin(email, password)  — async; resolves on success, throws on failure
 *   onClose()                 — closes the modal
 *   authError                 — string error message from parent (e.g. unauthorised)
 *   loading                   — true while the login + admin check is in progress
 */
export default function AdminLoginModal({ onLogin, onClose, authError, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const emailRef = useRef(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [loading, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setFieldError('Email is required.'); return }
    if (!password) { setFieldError('Password is required.'); return }
    setFieldError('')
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      const msg = mapFirebaseError(err.code)
      setFieldError(msg)
    }
  }

  const displayError = authError || fieldError

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 pt-7 pb-6 flex flex-col items-center gap-3">
          <Logo variant="dark" size="sm" />
          <div className="text-center">
            <h1
              id="modal-title"
              className="text-base font-bold text-white mt-1"
            >
              Official Access
            </h1>
            <p className="text-xs text-white/60 mt-0.5">
              Huduma Centre staff only
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 flex flex-col gap-4"
          noValidate
          aria-label="Admin login form"
        >
          {displayError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"
            >
              <p className="text-sm text-red-700 font-medium">{displayError}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="admin-email"
              className="text-sm font-semibold text-gray-700"
            >
              Email address
            </label>
            <input
              id="admin-email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError('') }}
              disabled={loading}
              className="h-11 px-3.5 rounded-lg border border-gray-200 bg-gray-50
                text-gray-900 text-sm
                focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none
                disabled:opacity-50 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="admin-password"
              className="text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldError('') }}
              disabled={loading}
              className="h-11 px-3.5 rounded-lg border border-gray-200 bg-gray-50
                text-gray-900 text-sm
                focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none
                disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 rounded-lg text-sm font-semibold text-gray-600
                border border-gray-200 hover:bg-gray-50 transition-colors
                disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex-[2] h-11 rounded-lg text-sm font-semibold text-white
                bg-primary hover:bg-primary-light
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" label="Signing in…" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Security notice */}
        <div className="px-6 pb-5">
          <p className="text-xs text-gray-400 text-center">
            Unauthorised access is prohibited and monitored.
          </p>
        </div>
      </div>
    </div>
  )
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}
