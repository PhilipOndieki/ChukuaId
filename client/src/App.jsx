import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useAuth } from './hooks/useAuth'
import { useAdmin } from './hooks/useAdmin'
import LandingPage from './components/public/LandingPage'
import AdminLoginModal from './components/admin/AdminLoginModal'
import AdminDashboard from './components/admin/AdminDashboard'
import LoadingSpinner from './components/shared/LoadingSpinner'

/**
 * AppRoutes — renders the correct view based on URL and auth state.
 *
 * /          — public landing page
 * /admin     — admin login modal overlaid on the landing page
 *              once authenticated, renders the full dashboard
 */
function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, signIn } = useAuth()
  const { adminData, adminLoading, isAuthorised, checked } = useAdmin(user)

  const [loginLoading, setLoginLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const isAdminRoute = location.pathname === '/admin'

  // If an authenticated user has no admin document, sign them out immediately
  useEffect(() => {
    if (user && !adminLoading && checked && !isAuthorised) {
      setAuthError('Unauthorised access. This account is not registered as an official.')
      signOut(auth)
    }
    
  }, [user, adminLoading, isAuthorised, checked])

  // If admin navigates away from /admin while logged out, redirect to /
  useEffect(() => {
    if (!authLoading && !user && isAdminRoute) {
      // Stay on /admin to keep modal open
    }
    if (!authLoading && user && isAuthorised && !isAdminRoute) {
      navigate('/admin')
    }
  }, [authLoading, user, isAuthorised, isAdminRoute, navigate])

  async function handleLogin(email, password) {
    setLoginLoading(true)
    setAuthError('')
    try {
      await signIn(email, password)
      // Admin check runs via useAdmin hook after user state updates
    } catch (err) {
      setLoginLoading(false)
      throw err
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    navigate('/')
  }

  function handleAdminClick() {
    navigate('/admin')
  }

  function handleCloseModal() {
    setAuthError('')
    navigate('/')
  }

  // Show a full-screen loader while Firebase resolves the initial auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" color="white" label="Loading…" />
      </div>
    )
  }

  // Authenticated + authorised → show dashboard
  if (user && isAuthorised && adminData) {
    return <AdminDashboard adminData={adminData} onSignOut={handleSignOut} />
  }

  // Not authenticated → show public site, with optional admin modal overlay
  return (
    <div className="relative">
      <LandingPage onAdminClick={handleAdminClick} />

      {isAdminRoute && (
        <AdminLoginModal
          onLogin={handleLogin}
          onClose={handleCloseModal}
          authError={authError}
          loading={loginLoading || adminLoading}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}
