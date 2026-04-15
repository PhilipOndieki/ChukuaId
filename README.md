# Chukua ID
![chukua id home](image.png)
chukuaid.vercel.app
A civic web platform that helps Kenyan citizens locate their uncollected national ID cards held at Huduma Centres across Kenya. Over 490,000 ID cards remain uncollected nationwide. Chukua ID bridges the gap between citizens and government offices through a simple, privacy-first search interface.
---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Adding an Admin](#adding-an-admin)
- [Firestore Data Structure](#firestore-data-structure)
- [Security Rules](#security-rules)
- [Privacy and Data Masking](#privacy-and-data-masking)
- [Public Search Flow](#public-search-flow)
- [Admin Panel Flow](#admin-panel-flow)
- [Deployment](#deployment)
- [Africa's Talking SMS Integration](#africas-talking-sms-integration)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)

---

## Overview

Chukua ID has two distinct interfaces sharing one Firestore database:

**Public site** — any citizen can search for their uncollected ID card using a two-step verification process. Step one checks if the ID number exists in the system. Step two verifies the citizen's date of birth before revealing the collection centre details.

**Admin panel** — Huduma Centre officials log in to add uncollected ID records for their specific centre and mark records as collected once citizens pick them up.

---

## Features

**Public**
- Two-step search: ID number lookup followed by date of birth verification
- Privacy-first: ID numbers are masked on screen, DOB is hashed and never returned to the client
- Brute force protection: 3 failed attempts triggers a 10-minute lockout
- Subscribe for SMS or email alert when an ID is registered
- Share result card with no sensitive data exposed
- Fully mobile-responsive, works on 320px screens

**Admin**
- Secure login via Firebase Auth with Firestore authorisation check
- Centre-scoped access: admins can only manage records for their own Huduma Centre
- Add ID records with full validation
- Mark records as collected with a two-step confirmation
- Filter records by status: all, uncollected, collected
- Stats bar showing total records, awaiting collection, and collected counts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Database | Cloud Firestore |
| Authentication | Firebase Auth |
| Hosting | Firebase Hosting |
| Functions | Firebase Cloud Functions (Node.js 20) |
| SMS notifications | Africa's Talking |
| Routing | React Router v6 |

---

## Project Structure

```
chukua-id/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AddIdForm.jsx          # Form to add new ID records
│   │   │   ├── AdminDashboard.jsx     # Main admin interface
│   │   │   ├── AdminLoginModal.jsx    # Login modal overlay
│   │   │   └── IdRecordsTable.jsx     # Records table with status filter
│   │   ├── public/
│   │   │   ├── Footer.jsx             # Discreet official access link
│   │   │   ├── LandingPage.jsx        # Hero page with search flow
│   │   │   ├── ResultCard.jsx         # ID collection details card
│   │   │   ├── SearchForm.jsx         # Step 1: ID number input
│   │   │   ├── SubscribeForm.jsx      # Subscribe for alert if not found
│   │   │   └── VerifyForm.jsx         # Step 2: DOB verification
│   │   └── shared/
│   │       ├── LoadingSpinner.jsx
│   │       └── Logo.jsx
│   ├── hooks/
│   │   ├── useAdmin.js                # Fetches and validates admin record
│   │   └── useAuth.js                 # Firebase Auth state wrapper
│   ├── utils/
│   │   ├── lockout.js                 # Brute force lockout logic
│   │   └── maskId.js                  # ID number masking utility
│   ├── App.jsx                        # Root component and routing
│   ├── firebase.js                    # Firebase initialisation
│   ├── index.css                      # Tailwind base styles
│   └── main.jsx                       # React entry point
├── functions/
│   └── index.js                       # Cloud Functions (verifyDob, notifySubscribers)
├── firestore.rules                    # Firestore security rules
├── firestore.indexes.json             # Composite index definitions
├── firebase.json                      # Firebase hosting and functions config
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Prerequisites

Make sure you have the following installed before starting:

- Node.js 18 or higher
- npm 9 or higher
- Firebase CLI

Install Firebase CLI globally if you have not already:

```bash
npm install -g firebase-tools
```

---

## Local Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/PhilipOndieki/chukua-id.git
cd chukua-id
npm install
```

Install Cloud Functions dependencies:

```bash
cd functions
npm install
cd ..
```

Copy the environment variables template:

```bash
cp .env.example .env
```

Fill in your Firebase project values in `.env` (see Environment Variables section below).

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the root of the project with the following values. Never commit this file to version control.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can find all these values in Firebase Console under Project Settings → General → Your apps.

---

## Firebase Setup

**Step 1 — Create a Firebase project**

Go to [console.firebase.google.com](https://console.firebase.google.com), create a new project named `chukuaid`, and register a web app.

**Step 2 — Enable Firestore**

Go to Firestore Database → Create database → Start in production mode → Select your region.

The recommended region for Kenya is `europe-west3` (Frankfurt) for lowest latency.

**Step 3 — Enable Authentication**

Go to Authentication → Get started → Sign-in method → Enable Email/Password.

**Step 4 — Log in to Firebase CLI**

```bash
firebase login
firebase use --add
```

Select your project and give it the alias `staging` for local development or `production` for live.

**Step 5 — Deploy Firestore rules and indexes**

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**Step 6 — Deploy to Firebase Hosting**

```bash
npm run deploy
```

This command runs `npm run build` followed by `firebase deploy` in one step.

---

## Adding an Admin

Admins are created manually by the super admin. There is no public registration. Follow these exact steps for every new Huduma Centre official you onboard.

**Step 1 — Create the user in Firebase Authentication**

Go to Firebase Console → Authentication → Users → Add user. Enter the official's email and a temporary password. Click Add user. Copy the UID that appears in the users table.

**Step 2 — Create their document in Firestore**

Go to Firestore Database → Start collection (if `admins` does not exist yet).

- Collection ID: `admins`
- Document ID: paste the exact UID copied from Authentication
- Add the following fields:

| Field | Type | Value |
|---|---|---|
| uid | string | same UID as the document ID |
| email | string | official's email address |
| centre | string | e.g. Westlands Huduma Centre |
| county | string | e.g. Nairobi |
| createdAt | timestamp | set to now |

**Step 3 — Send credentials to the official**

From Firebase Console → Authentication → Users, click the three dots next to the official's account and select "Send password reset email". The official sets their own password without you ever handling it.

They log in via the "Official access" link in the footer of the public site.

---

## Firestore Data Structure

**`ids` collection**

Document ID is the national ID number.

```
ids/
  {idNumber}/
    name          string      Full name as printed on the ID card
    dob           string      SHA-256 hash of the date of birth + salt
    centre        string      Huduma Centre name
    county        string      County name
    address       string      Physical address of the centre
    phone         string      Centre phone number
    hours         string      Operating hours
    status        string      "uncollected" or "collected"
    addedBy       string      UID of the admin who added the record
    addedAt       timestamp   When the record was created
    collectedAt   timestamp   When the ID was collected, null if uncollected
```

**`admins` collection**

Document ID is the Firebase Auth UID.

```
admins/
  {uid}/
    uid           string      Firebase Auth UID
    email         string      Official's email address
    centre        string      Huduma Centre name
    county        string      County name
    createdAt     timestamp   When the admin account was created
```

**`subscribers` collection**

Document ID is the national ID number.

```
subscribers/
  {idNumber}/
    idNumber      string      The ID number subscribed to
    contacts      array       Phone numbers or email addresses
    createdAt     timestamp   When the first subscription was created
```

---

## Security Rules

The Firestore security rules enforce the following access policy:

- Public users can read ID records only if status is `uncollected`
- Authenticated admins can read all records regardless of status
- Admins can only create records with their own UID in the `addedBy` field
- Admins can only update records they personally added
- No one can delete any record
- Admin documents are read-only to the owner, no public write
- Anyone can subscribe but contacts list is capped at 50 entries
- Only admins can read the subscribers list

After any change to `firestore.rules`, redeploy immediately:

```bash
firebase deploy --only firestore:rules
```

---

## Privacy and Data Masking

Chukua ID handles citizen data and applies the following privacy protections by design:

**ID number masking** — the national ID number is never displayed in full anywhere on the public site. It is always rendered in the format `35****890` showing only the first two and last three digits.

**DOB hashing** — the date of birth is hashed using SHA-256 with a project-specific salt before being written to Firestore. The raw date of birth never exists in the database and is never returned to any client. Verification compares hashes only.

The hashing function used across `AddIdForm.jsx` and `VerifyForm.jsx`:

```js
async function hashDob(dob) {
  const encoder = new TextEncoder()
  const data = encoder.encode(dob + 'chukuaid_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

**Two-step verification** — step one only confirms existence. No document data is returned until the DOB hash matches in step two.

**Brute force lockout** — three failed DOB attempts locks the search for that ID number for 10 minutes, stored in localStorage.

**Share result** — the shareable text generated by the result card contains only the collection centre details and the masked ID number. No full ID number, no date of birth.

---

## Public Search Flow

```
User visits chukuaid.co.ke
        ↓
Enter national ID number
        ↓
Firestore getDoc by document ID
        ↓
Found and uncollected?
   ↓ Yes                    ↓ No
Enter date of birth    Subscribe form
        ↓              (phone or email)
Hash input DOB
Compare with stored hash
        ↓
Match?
   ↓ Yes              ↓ No (max 3 attempts)
Show result card      Show error + attempts remaining
Centre, address,             ↓
phone, hours,         3rd failure → 10 min lockout
masked ID number
```

---

## Admin Panel Flow

```
Click "Official access" in footer
        ↓
Enter email and password
        ↓
Firebase Auth sign-in
        ↓
useAdmin checks admins/{uid} in Firestore
        ↓
Document found?
   ↓ Yes                    ↓ No
Load dashboard         Sign out immediately
with centre and        Show unauthorised error
county from doc
        ↓
Add ID records (scoped to their centre)
Mark records as collected
View and filter all records they added
```

---

## Deployment

**Full deployment (hosting + rules + indexes + functions):**

```bash
npm run deploy
```

**Hosting only:**

```bash
firebase deploy --only hosting
```

**Rules only:**

```bash
firebase deploy --only firestore:rules
```

**Functions only (requires Blaze plan):**

```bash
firebase deploy --only functions
```

The `npm run deploy` script in `package.json` runs `vite build` then `firebase deploy` sequentially.

---

## Africa's Talking SMS Integration

SMS notifications are handled by the `notifySubscribers` Cloud Function which fires when a new ID document is created in Firestore.

**Requirements:**

- Firebase Blaze plan (pay as you go) — required for Cloud Functions
- Africa's Talking account with a registered sender ID `CHUKUAID`

**Setup:**

Store your Africa's Talking credentials as Firebase secrets:

```bash
firebase functions:secrets:set AT_API_KEY
firebase functions:secrets:set AT_USERNAME
```

When prompted enter your API key and username from your Africa's Talking dashboard.

**Deploy functions:**

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Without Blaze plan:**

The app works fully without Cloud Functions. DOB verification runs client-side via a direct Firestore read. The DOB hash comparison happens in the browser. SMS notifications will not fire but all other features including subscriptions, search, and the admin panel work without the Blaze upgrade.

---

## Known Limitations

**No fuzzy name search** — the public flow uses exact document ID lookup by ID number only. This is by design for privacy and performance.

**Client-side DOB verification** — without Cloud Functions deployed, the hashed DOB field is technically readable from the Firestore response in DevTools. The SHA-256 hash makes it computationally infeasible to reverse but the ideal production setup uses the `verifyDob` Cloud Function which performs the comparison server-side and never returns the hash to the client.

**localStorage lockout** — the brute force lockout is stored in localStorage. A user who clears their browser storage can reset it. The Cloud Function adds a server-side rate limiting layer that closes this gap.

**No email delivery** — the `notifySubscribers` function logs email contacts but does not send emails. Integrate SendGrid or Mailgun and add the delivery logic in `functions/index.js` where the comment indicates.

---

## Contributing

This is a civic project. Contributions that improve accessibility, performance on low-end devices, or Swahili language support are especially welcome.

To contribute: fork the repository, create a feature branch, make your changes, and open a pull request against `main`. Please do not commit `.env` files or any Firebase credentials.

---

Chukua ID yako leo.