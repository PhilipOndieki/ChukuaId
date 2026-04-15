import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * SearchForm — Step 1 of the public search flow.
 *
 * Accepts a national ID number, queries Firestore by document ID, and
 * returns only a boolean signal (found / not found). No document data
 * is exposed to the client at this step.
 *
 * Props:
 *   onFound(idNumber)    — called when an uncollected ID is found
 *   onNotFound(idNumber) — called when the ID is not in the database
 */
export default function SearchForm({ onFound, onNotFound }) {
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputError, setInputError] = useState('')

  function validate(value) {
    if (!value.trim()) return 'Please enter your ID number.'
    if (!/^\d{7,9}$/.test(value.trim())) return 'Enter a valid 7–9 digit national ID number.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = idNumber.trim()
    const error = validate(trimmed)
    if (error) { setInputError(error); return }

    setInputError('')
    setLoading(true)

    try {
      const idRef = doc(db, 'ids', trimmed)
      const idSnap = await getDoc(idRef)

      // Step 1 returns a boolean only.
      // The actual record data is gated behind DOB verification in Step 2.
      if (idSnap.exists() && idSnap.data().status === 'uncollected') {
        onFound(trimmed)
      } else {
        onNotFound(trimmed)
      }
    } catch {
      setInputError('Unable to search at this time. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    // Allow digits only
    const val = e.target.value.replace(/\D/g, '')
    setIdNumber(val)
    if (inputError) setInputError('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto"
      noValidate
      aria-label="Search for your national ID card"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <label htmlFor="id-search" className="sr-only">
            National ID number
          </label>
          <input
            id="id-search"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={9}
            value={idNumber}
            onChange={handleChange}
            placeholder="Enter your ID number"
            disabled={loading}
            aria-invalid={!!inputError}
            aria-describedby={inputError ? 'search-error' : undefined}
            className="w-full h-12 px-4 rounded-lg bg-white text-gray-900 placeholder-gray-400
              text-base font-medium shadow-lg
              border-2 border-transparent
              focus:border-amber-400 focus:outline-none
              disabled:opacity-60 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !idNumber}
          className="h-12 px-6 rounded-lg font-semibold text-white text-base
            bg-amber-500 hover:bg-amber-400 active:bg-amber-600
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg transition-colors duration-150
            flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="white" label="Searching…" />
              Searching…
            </>
          ) : (
            <>
              <SearchIcon />
              Search
            </>
          )}
        </button>
      </div>

      {inputError && (
        <p
          id="search-error"
          role="alert"
          className="mt-2 text-sm text-red-300 font-medium"
        >
          {inputError}
        </p>
      )}
    </form>
  )
}

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  )
}
