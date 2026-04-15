import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useAdmin(user) {
  const [adminData, setAdminData] = useState(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [isAuthorised, setIsAuthorised] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!user) {
      setAdminData(null)
      setIsAuthorised(false)
      setAdminLoading(false)
      setChecked(false)
      return
    }

    let cancelled = false
    setAdminLoading(true)
    setChecked(false)

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
        if (!cancelled) {
          setAdminLoading(false)
          setChecked(true)
        }
      }
    }

    fetchAdmin()
    return () => { cancelled = true }
  }, [user])

  return { adminData, adminLoading, isAuthorised, checked }
}