import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * useAdmin — fetches and validates the admin record for the authenticated user.
 *
 * After Firebase Auth resolves, this hook checks the `admins` Firestore
 * collection. If no admin document exists the user is flagged as unauthorised
 * and the caller should sign them out immediately.
 *
 * Returns:
 *   adminData     — { uid, email, centre, county, createdAt } or null
 *   adminLoading  — true while fetching
 *   isAuthorised  — true only if an admin document was found
 */
export function useAdmin(user) {
  const [adminData, setAdminData] = useState(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [isAuthorised, setIsAuthorised] = useState(false)

  useEffect(() => {
    if (!user) {
      setAdminData(null)
      setIsAuthorised(false)
      setAdminLoading(false)
      return
    }

    let cancelled = false
    setAdminLoading(true)

    async function fetchAdmin() {
      try {
        const adminRef = doc(db, 'admins', user.uid)
        const adminSnap = await getDoc(adminRef)

        if (cancelled) return

        if (adminSnap.exists()) {
          setAdminData(adminSnap.data())
          setIsAuthorised(true)
        } else {
          setAdminData(null)
          setIsAuthorised(false)
        }
      } catch {
        if (!cancelled) {
          setAdminData(null)
          setIsAuthorised(false)
        }
      } finally {
        if (!cancelled) setAdminLoading(false)
      }
    }

    fetchAdmin()
    return () => { cancelled = true }
  }, [user])

  return { adminData, adminLoading, isAuthorised }
}
