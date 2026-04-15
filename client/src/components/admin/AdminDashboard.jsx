import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from '../../firebase'
import Logo from '../shared/Logo'
import AddIdForm from './AddIdForm'
import IdRecordsTable from './IdRecordsTable'

/**
 * AdminDashboard — the main interface for Huduma Centre officials.
 *
 * Shows:
 *   - Admin's centre and county in the header
 *   - Records table with status filter and "Mark collected" action
 *   - Add new ID record form (collapsed by default, expandable)
 *
 * Props:
 *   adminData — { uid, email, centre, county } from the admins collection
 *   onSignOut — callback to sign the admin out
 */
export default function AdminDashboard({ adminData, onSignOut }) {
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true)
    try {
      const q = query(
        collection(db, 'ids'),
        where('addedBy', '==', adminData.uid),
        orderBy('addedAt', 'desc')
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ idNumber: d.id, ...d.data() }))
      setRecords(docs)
    } catch {
      // In production, surface via a toast
    } finally {
      setLoadingRecords(false)
    }
  }, [adminData.uid])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  function handleRecordAdded() {
    setShowAddForm(false)
    fetchRecords()
  }

  const uncollectedCount = records.filter((r) => r.status === 'uncollected').length
  const totalCount = records.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="bg-primary shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="light" size="sm" />
            <div className="hidden sm:block w-px h-8 bg-white/20" aria-hidden="true" />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                {adminData.county} County
              </p>
              <p className="text-sm font-bold text-white leading-tight">
                {adminData.centre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-white/50 truncate max-w-[180px]">
              {adminData.email}
            </span>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/70
                hover:text-white border border-white/20 hover:border-white/50 rounded-lg
                px-3 py-2 transition-colors"
            >
              <SignOutIcon className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total records" value={totalCount} />
          <StatCard label="Awaiting collection" value={uncollectedCount} highlight />
          <StatCard
            label="Collected"
            value={totalCount - uncollectedCount}
            className="hidden sm:flex"
          />
        </div>

        {/* Centre info — mobile only */}
        <div className="sm:hidden bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {adminData.county} County
          </p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{adminData.centre}</p>
        </div>

        {/* Add new record */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-primary
                hover:text-primary-dark transition-colors"
              aria-expanded={showAddForm}
            >
              <span className={`w-5 h-5 rounded-full border-2 border-primary
                flex items-center justify-center text-primary transition-transform
                ${showAddForm ? 'rotate-45' : ''}`}
                aria-hidden="true"
              >
                +
              </span>
              {showAddForm ? 'Close form' : 'Add new ID record'}
            </button>
          </div>

          {showAddForm && (
            <div className="animate-fadeIn">
              <AddIdForm adminData={adminData} onSuccess={handleRecordAdded} />
            </div>
          )}
        </div>

        {/* Records table */}
        <IdRecordsTable
          records={records}
          loading={loadingRecords}
          onRefresh={fetchRecords}
        />
      </main>
    </div>
  )
}

function StatCard({ label, value, highlight, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5
      flex flex-col gap-0.5 ${className}`}
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-500' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}

function SignOutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  )
}
