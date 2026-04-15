import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { maskIdNumber } from '../../utils/maskId'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * IdRecordsTable — displays the admin's ID records with status filter and
 * "Mark as collected" action.
 *
 * Props:
 *   records    — array of Firestore document snapshots
 *   onRefresh  — callback to re-fetch records from the parent
 *   loading    — true while the parent is fetching
 */
export default function IdRecordsTable({ records, onRefresh, loading }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [collectingId, setCollectingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const filtered = records.filter((r) => {
    if (statusFilter === 'all') return true
    return r.status === statusFilter
  })

  async function handleMarkCollected(idNumber) {
    if (confirmId !== idNumber) {
      setConfirmId(idNumber)
      return
    }

    setConfirmId(null)
    setCollectingId(idNumber)

    try {
      await updateDoc(doc(db, 'ids', idNumber), {
        status: 'collected',
        collectedAt: serverTimestamp(),
      })
      onRefresh?.()
    } catch {
      // In production, surface this error via a toast notification
    } finally {
      setCollectingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3
        items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          ID Records
          {!loading && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} shown)
            </span>
          )}
        </h2>

        {/* Status filter */}
        <div className="flex gap-1.5 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'uncollected', label: 'Uncollected' },
            { value: 'collected', label: 'Collected' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary
            hover:text-primary-dark transition-colors disabled:opacity-40"
          aria-label="Refresh records"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" color="green" label="Loading records…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm font-medium">No records found.</p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Show all records
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="ID records">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>ID Number</Th>
                <Th>Full Name</Th>
                <Th>Date Added</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((record) => (
                <tr
                  key={record.idNumber}
                  className={`transition-colors ${
                    record.status === 'collected' ? 'bg-gray-50/50' : 'hover:bg-amber-50/30'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
                    {maskIdNumber(record.idNumber)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {record.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(record.addedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {record.status === 'uncollected' && (
                      collectingId === record.idNumber ? (
                        <LoadingSpinner size="sm" color="green" label="Updating…" />
                      ) : confirmId === record.idNumber ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkCollected(record.idNumber)}
                            className="text-xs font-semibold text-white bg-green-600
                              hover:bg-green-700 rounded px-2 py-1 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs font-semibold text-gray-500
                              hover:text-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkCollected(record.idNumber)}
                          className="text-xs font-semibold text-primary hover:text-primary-dark
                            border border-primary/30 hover:border-primary rounded px-2.5 py-1
                            transition-colors"
                        >
                          Mark collected
                        </button>
                      )
                    )}
                    {record.status === 'collected' && (
                      <span className="text-xs text-gray-400">
                        {formatDate(record.collectedAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  )
}

function StatusBadge({ status }) {
  if (status === 'collected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        text-xs font-semibold bg-gray-100 text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
        Collected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
      Uncollected
    </span>
  )
}

function formatDate(timestamp) {
  if (!timestamp) return '—'
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}
