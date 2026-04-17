import { useState, useEffect } from 'react'
import Logo from '../shared/Logo'
import SearchForm from './SearchForm'
import VerifyForm from './VerifyForm'
import ResultCard from './ResultCard'
import SubscribeForm from './SubscribeForm'
import Footer from './Footer'

/**
 * Search flow states:
 *   'idle'       — Initial state, show search form
 *   'verify'     — ID found, show DOB verification
 *   'result'     — DOB verified, show result card
 *   'subscribe'  — ID not found, show subscribe form
 */

export default function LandingPage({ onAdminClick }) {
  const [step, setStep] = useState('idle')
  const [currentIdNumber, setCurrentIdNumber] = useState('')
  const [verifiedRecord, setVerifiedRecord] = useState(null)

  // Reset to idle
  function handleReset() {
    setStep('idle')
    setCurrentIdNumber('')
    setVerifiedRecord(null)
  }

  // Step 1 callbacks
  function handleFound(idNumber) {
    setCurrentIdNumber(idNumber)
    setStep('verify')
  }

  function handleNotFound(idNumber) {
    setCurrentIdNumber(idNumber)
    setStep('subscribe')
  }

  // Step 2 callback
  function handleVerified(record) {
    setVerifiedRecord(record)
    setStep('result')
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/maasai.webp')`,
        }}
        role="img"
        aria-label="Interior of a Kenyan government office"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 hero-overlay" aria-hidden="true" />

      {/* Content */}
      <div
        className="relative z-10 min-h-screen flex flex-col items-center justify-start
          px-4 py-16 sm:px-6"
      >
        {/* Logo + tagline */}
        <div className="mb-10 text-center">
          <Logo variant="light" size="lg" />
        </div>

        {/* Search panel */}
        <div className="w-full max-w-lg">
          {step === 'idle' && (
            <SearchForm onFound={handleFound} onNotFound={handleNotFound} />
          )}

          {step === 'verify' && (
            <VerifyForm
              idNumber={currentIdNumber}
              onVerified={handleVerified}
              onBack={handleReset}
            />
          )}

          {step === 'result' && verifiedRecord && (
            <ResultCard record={verifiedRecord} onBack={handleReset} />
          )}

          {step === 'subscribe' && (
            <SubscribeForm idNumber={currentIdNumber} onBack={handleReset} />
          )}
        </div>

        {/* Help text — only visible on initial step */}
        {step === 'idle' && (
          <p className="mt-6 text-center text-sm text-white/55 max-w-sm">
            Enter your national ID number to check if your card is ready for
            collection at a Huduma Centre near you.
          </p>
        )}
      </div>

      {/* Discreet admin footer link */}
      <Footer onAdminClick={onAdminClick} />
    </div>
  )
}
