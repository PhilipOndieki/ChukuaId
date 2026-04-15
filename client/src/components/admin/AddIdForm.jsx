import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * AddIdForm — form for admins to register a new uncollected ID record.
 *
 * The `centre` and `county` fields are pre-filled from the admin's own
 * Firestore record and are not editable (only Huduma Centre staff can add
 * IDs for their own centre).
 *
 * Props:
 *   adminData  — { uid, centre, county } from the admins collection
 *   onSuccess  — called after a record is successfully added
 */
export default function AddIdForm({ adminData, onSuccess }) {
  const initialState = {
    name: '',
    idNumber: '',
    dob: '',
    address: '',
    phone: '',
    hours: '',
  }

  const [fields, setFields] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccessMsg('')
  }

  function validate() {
    if (!fields.name.trim()) return 'Full name is required.'
    if (!/^\d{7,9}$/.test(fields.idNumber.trim())) return 'ID number must be 7–9 digits.'
    if (!fields.dob) return 'Date of birth is required.'
    if (!fields.address.trim()) return 'Physical address is required.'
    if (!fields.phone.trim()) return 'Phone number is required.'
    if (!fields.hours.trim()) return 'Operating hours are required.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')

    try {
      const idRef = doc(db, 'ids', fields.idNumber.trim())
      await setDoc(idRef, {
        name: fields.name.trim(),
        dob: fields.dob,
        centre: adminData.centre,
        county: adminData.county,
        address: fields.address.trim(),
        phone: fields.phone.trim(),
        hours: fields.hours.trim(),
        status: 'uncollected',
        addedBy: adminData.uid,
        addedAt: serverTimestamp(),
        collectedAt: null,
      })

      setFields(initialState)
      setSuccessMsg(`ID ${fields.idNumber.trim()} added successfully.`)
      onSuccess?.()
    } catch (err) {
      if (err.code === 'permission-denied') {
        setError('Permission denied. Only authorised admins can add records.')
      } else if (err.code === 'already-exists') {
        setError('An ID record with this number already exists.')
      } else {
        setError('Failed to add record. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Add new ID record</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Record will be assigned to{' '}
          <span className="font-semibold text-primary">{adminData.centre}</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-5 py-5 space-y-4"
        noValidate
        aria-label="Add ID record form"
      >
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div role="status" className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
            <p className="text-sm text-green-700 font-medium">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="name"
            label="Full name"
            name="name"
            value={fields.name}
            onChange={handleChange}
            placeholder="As printed on the ID card"
            disabled={loading}
            required
          />
          <FormField
            id="idNumber"
            label="ID number"
            name="idNumber"
            value={fields.idNumber}
            onChange={(e) => {
              handleChange({ target: { name: 'idNumber', value: e.target.value.replace(/\D/g, '') } })
            }}
            placeholder="7–9 digit number"
            inputMode="numeric"
            maxLength={9}
            disabled={loading}
            required
          />
          <FormField
            id="dob"
            label="Date of birth"
            name="dob"
            type="date"
            value={fields.dob}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            disabled={loading}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Huduma Centre
            </label>
            <div className="h-10 px-3 rounded-lg bg-gray-100 border border-gray-200 flex items-center">
              <span className="text-sm text-gray-500">{adminData.centre}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              County
            </label>
            <div className="h-10 px-3 rounded-lg bg-gray-100 border border-gray-200 flex items-center">
              <span className="text-sm text-gray-500">{adminData.county}</span>
            </div>
          </div>
          <FormField
            id="phone"
            label="Centre phone"
            name="phone"
            type="tel"
            value={fields.phone}
            onChange={handleChange}
            placeholder="+254 20 XXXXXXX"
            disabled={loading}
            required
          />
        </div>

        <FormField
          id="address"
          label="Physical address"
          name="address"
          value={fields.address}
          onChange={handleChange}
          placeholder="Building, street, town"
          disabled={loading}
          required
        />
        <FormField
          id="hours"
          label="Operating hours"
          name="hours"
          value={fields.hours}
          onChange={handleChange}
          placeholder="Mon–Fri 8:00am–5:00pm, Sat 8:00am–12:00pm"
          disabled={loading}
          required
        />

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-semibold text-white text-sm
              bg-primary hover:bg-primary-light
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Adding record…
              </>
            ) : (
              'Add ID record'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({
  id, label, name, value, onChange, placeholder, type = 'text',
  inputMode, maxLength, max, disabled, required,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        max={max}
        disabled={disabled}
        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm
          focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none
          disabled:opacity-50 transition-colors placeholder-gray-400"
      />
    </div>
  )
}
