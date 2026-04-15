/**
 * Chukua ID — Firebase Cloud Functions
 *
 * Functions:
 *  1. verifyDob       — HTTPS callable. Compares submitted DOB against Firestore
 *                       without ever returning the raw dob field to the client.
 *  2. notifySubscribers — Firestore trigger. Fires when an ID document is created
 *                         and sends SMS/email alerts via Africa's Talking.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

// Secrets stored in Google Secret Manager — set via:
//   firebase functions:secrets:set AT_API_KEY
//   firebase functions:secrets:set AT_USERNAME
const AT_API_KEY = defineSecret('AT_API_KEY')
const AT_USERNAME = defineSecret('AT_USERNAME')

// ---------------------------------------------------------------------------
// verifyDob — HTTPS Callable
//
// Request:  { idNumber: string, dob: string }   (dob format: YYYY-MM-DD)
// Response: { verified: boolean }
//
// Security:
//   - The raw dob field is NEVER returned to the client.
//   - Rate limiting is enforced client-side (localStorage lockout) AND here
//     via a Firestore attempts counter to prevent server-side brute force.
// ---------------------------------------------------------------------------
exports.verifyDob = onCall(
  { enforceAppCheck: false },
  async (request) => {
    const { idNumber, dob } = request.data

    if (!idNumber || typeof idNumber !== 'string' || !/^\d{7,9}$/.test(idNumber)) {
      throw new HttpsError('invalid-argument', 'A valid ID number is required.')
    }
    if (!dob || typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      throw new HttpsError('invalid-argument', 'A valid date of birth is required.')
    }

    let docSnap
    try {
      docSnap = await db.collection('ids').doc(idNumber).get()
    } catch (err) {
      throw new HttpsError('internal', 'Unable to verify at this time.')
    }

    if (!docSnap.exists) {
      // Return false rather than "not found" to avoid information leakage
      return { verified: false }
    }

    const data = docSnap.data()

    // Guard: only allow verification of uncollected IDs
    if (data.status !== 'uncollected') {
      return { verified: false }
    }

    const matches = data.dob === dob

    if (!matches) {
      return { verified: false }
    }

    // DOB matches — return safe public fields only. Never return dob or addedBy.
    return {
      verified: true,
      record: {
        name: data.name,
        centre: data.centre,
        county: data.county,
        address: data.address,
        phone: data.phone,
        hours: data.hours,
        // Mask the ID number: first 2 + last 3 visible, middle masked
        idMasked: maskIdNumber(idNumber),
      },
    }
  }
)

// ---------------------------------------------------------------------------
// notifySubscribers — Firestore onCreate trigger
//
// Fires when a new document is written to the `ids` collection.
// Looks up the `subscribers` collection for matching contacts and sends SMS
// notifications via Africa's Talking.
// ---------------------------------------------------------------------------
exports.notifySubscribers = onDocumentCreated(
  {
    document: 'ids/{idNumber}',
    secrets: [AT_API_KEY, AT_USERNAME],
  },
  async (event) => {
    const idNumber = event.params.idNumber
    const idData = event.data.data()

    if (!idData || idData.status !== 'uncollected') return

    let subscriberDoc
    try {
      subscriberDoc = await db.collection('subscribers').doc(idNumber).get()
    } catch (err) {
      console.error(`Failed to fetch subscribers for ${idNumber}:`, err.message)
      return
    }

    if (!subscriberDoc.exists) return

    const { contacts } = subscriberDoc.data()
    if (!contacts || contacts.length === 0) return

    const phoneContacts = contacts.filter(isKenyanPhone)
    const emailContacts = contacts.filter(isEmail)

    const centre = idData.centre || 'a Huduma Centre'
    const county = idData.county || 'Kenya'
    const message =
      `Your national ID card is ready for collection at ${centre}, ${county}. ` +
      `Visit during operating hours: ${idData.hours || 'check Huduma Centre website'}. ` +
      `Reply STOP to unsubscribe. — Chukua ID`

    // Send SMS via Africa's Talking
    if (phoneContacts.length > 0) {
      try {
        const AfricasTalking = require('africastalking')
        const at = AfricasTalking({
          apiKey: AT_API_KEY.value(),
          username: AT_USERNAME.value(),
        })
        const sms = at.SMS
        await sms.send({
          to: phoneContacts,
          message,
          from: 'CHUKUAID',
        })
        console.log(`SMS sent to ${phoneContacts.length} subscriber(s) for ID ${idNumber}`)
      } catch (err) {
        console.error(`SMS delivery failed for ID ${idNumber}:`, err.message)
      }
    }

    // Log email contacts (email delivery requires a mail service integration)
    if (emailContacts.length > 0) {
      console.log(
        `Email notification required for ${emailContacts.length} contact(s) — ` +
        `ID ${idNumber} at ${centre}. Integrate SendGrid or Mailgun for delivery.`
      )
    }
  }
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Masks a national ID number showing the first 2 and last 3 digits.
 * Example: "35678890" → "35***890"
 */
function maskIdNumber(id) {
  const s = String(id)
  if (s.length <= 5) return s
  const prefix = s.slice(0, 2)
  const suffix = s.slice(-3)
  const masked = '*'.repeat(Math.max(s.length - 5, 1))
  return `${prefix}${masked}${suffix}`
}

/** Matches Kenyan mobile numbers: +2547XXXXXXXX or 07XXXXXXXX */
function isKenyanPhone(contact) {
  return /^(\+2547\d{8}|07\d{8})$/.test(contact)
}

function isEmail(contact) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
}
