import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase'

/**
 * useAuth — wraps Firebase Auth state and sign-in/sign-out actions.
 *
 * Returns:
 *   user          — Firebase User object or null
 *   loading       — true while the initial auth state is resolving
 *   signIn(email, password) — resolves on success, throws on failure
 *   signOut()     — signs out the current user
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { user, loading, signIn, signOut }
}
