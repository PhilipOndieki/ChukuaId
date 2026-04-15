# Chukua ID

A Kenyan civic web platform that helps citizens locate their uncollected national ID cards held at Huduma Centres across Kenya.

---

## Architecture overview

```
chukua-id/
├── src/
│   ├── components/
│   │   ├── public/          # Public-facing search flow components
│   │   │   ├── LandingPage.jsx   — Hero + search state machine
│   │   │   ├── SearchForm.jsx    — Step 1: ID number lookup (boolean only)
│   │   │   ├── VerifyForm.jsx    — Step 2: DOB verification via Cloud Function
│   │   │   ├── ResultCard.jsx    — Masked result display after verification
│   │   │   ├── SubscribeForm.jsx — Subscribe for alert when ID becomes available
│   │   │   └── Footer.jsx        — Discreet "Official access" link
│   │   ├── admin/           # Huduma Centre staff interface
│   │   │   ├── AdminLoginModal.jsx  — Auth modal (modal over landing page)
│   │   │   ├── AdminDashboard.jsx   — Dashboard with stats and records table
│   │   │   ├── AddIdForm.jsx        — Form to register a new ID record
│   │   │   └── IdRecordsTable.jsx   — Filterable table with "Mark collected"
│   │   └── shared/
│   │       ├── Logo.jsx         — Chukua ID wordmark
│   │       └── LoadingSpinner.jsx
│   ├── hooks/
│   │   ├── useAuth.js       — Firebase Auth state + sign-in/sign-out
│   │   └── useAdmin.js      — Firestore admins collection lookup
│   ├── utils/
│   │   ├── maskId.js        — XX****XXX masking for public display
│   │   └── lockout.js       — localStorage brute-force lockout (3 attempts / 10 min)
│   ├── firebase.js          — Firebase app initialisation
│   ├── App.jsx              — React Router + auth routing logic
│   └── main.jsx
├── functions/
│   └── index.js             — Cloud Functions: verifyDob + notifySubscribers
├── firestore.rules          — Security rules
├── firestore.indexes.json   — Composite indexes for admin queries
├── firebase.json            — Hosting + Functions config
└── .env.example             — Environment variable template
```

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore, Authentication, Functions, and Hosting enabled
- An Africa's Talking account for SMS (optional for local development)

---

## Local development setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd chukua-id
npm install
cd functions && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase project values. These are found in:

**Firebase Console → Project Settings → General → Your apps → Firebase SDK snippet → Config**

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Log in to Firebase

```bash
firebase login
firebase use --add   # Select your project
```

### 4. Start the development server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Creating an admin account

Admin accounts are created manually — there is no self-registration flow by design.

### Step 1 — Create the Firebase Auth user

1. Open **Firebase Console → Authentication → Users**
2. Click **Add user**
3. Enter the official's work email address and a strong temporary password
4. Note the **User UID** shown in the users table

### Step 2 — Create the admin document in Firestore

1. Open **Firebase Console → Firestore Database**
2. Navigate to the **`admins`** collection (create it if it doesn't exist)
3. Click **Add document**
4. Set the **Document ID** to the User UID from Step 1
5. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | The Firebase Auth UID |
| `email` | string | The official's email address |
| `centre` | string | e.g. `"Huduma Centre Nairobi GPO"` |
| `county` | string | e.g. `"Nairobi"` |
| `createdAt` | timestamp | Current timestamp |

6. Click **Save**

The official can now sign in via the "Official access" link on the landing page. If the admin document does not exist, they will be immediately signed out with "Unauthorised access."

### Removing an admin

1. Delete the document from the `admins` collection in Firestore
2. Optionally disable or delete the Firebase Auth user

---

## Firestore data structure

### `ids/{idNumber}`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Full name as on the ID card |
| `dob` | string | Format `YYYY-MM-DD`. Write-only from public perspective. |
| `centre` | string | Huduma Centre name |
| `county` | string | County name |
| `address` | string | Physical address |
| `phone` | string | Centre phone number |
| `hours` | string | Operating hours |
| `status` | string | `uncollected` or `collected` |
| `addedBy` | string | Admin UID |
| `addedAt` | timestamp | |
| `collectedAt` | timestamp \| null | Set when status → collected |

### `admins/{uid}`

| Field | Type | Notes |
|-------|------|-------|
| `uid` | string | Firebase Auth UID |
| `email` | string | Work email |
| `centre` | string | Assigned Huduma Centre |
| `county` | string | County |
| `createdAt` | timestamp | |

### `subscribers/{idNumber}`

| Field | Type | Notes |
|-------|------|-------|
| `idNumber` | string | The searched ID number |
| `contacts` | string[] | Phone numbers and/or email addresses |
| `createdAt` | timestamp | |

---

## Configuring Africa's Talking (SMS notifications)

SMS alerts are sent via [Africa's Talking](https://africastalking.com). Credentials are stored as Google Cloud Secret Manager secrets — never in environment variables or source code.

### 1. Create an Africa's Talking account

1. Register at [account.africastalking.com](https://account.africastalking.com)
2. Create a new app in the AT dashboard
3. Note your **API Key** and **Username**
4. For production, register your sender ID (`CHUKUAID`) with AT and ensure your account has SMS credit

### 2. Store credentials in Secret Manager

```bash
firebase functions:secrets:set AT_API_KEY
# Paste your Africa's Talking API key when prompted

firebase functions:secrets:set AT_USERNAME
# Paste your Africa's Talking username (or "sandbox" for testing)
```

### 3. Sandbox testing

For local testing, use AT's sandbox:

- Username: `sandbox`
- Set `AT_USERNAME` to `sandbox`
- Use the [Africa's Talking simulator](https://simulator.africastalking.com) to view outbound messages

### 4. Deploy functions

```bash
firebase deploy --only functions
```

The `notifySubscribers` Cloud Function triggers automatically when a new document is created in the `ids` collection. It fetches matching subscribers and dispatches SMS alerts via AT.

---

## Deploying to Firebase Hosting

### 1. Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
```

### 2. Build and deploy the web app

```bash
npm run build
firebase deploy --only hosting
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Deploy everything at once

```bash
npm run deploy
```

---

## Security model

| Concern | Mitigation |
|---------|-----------|
| ID number exposure | Full ID never returned at Step 1; masked in all public-facing renders |
| DOB exposure | DOB is compared server-side in a Cloud Function; raw field never returned |
| Brute-force DOB guessing | Client-side: 3 attempts then 10-min localStorage lockout per ID. Server-side: Cloud Function validates input format and guards the comparison |
| Unauthorised admin access | Firebase Auth + Firestore `admins` doc check; immediate sign-out if no doc exists |
| Admin data leakage | `admins` collection: read only by the authenticated owner; no public read |
| Subscriber data leakage | `subscribers` collection: public write only; read restricted to authenticated admins |
| Record deletion | Delete permanently forbidden in Firestore rules for all users |
| Console logging | Sensitive fields (dob, full ID number) are never logged to the browser console |
| HTTPS headers | Security headers (X-Frame-Options, X-Content-Type-Options, etc.) set in `firebase.json` |

---

## Privacy notes

- The date of birth is stored in Firestore solely for identity verification. It is used only in the `verifyDob` Cloud Function and is never returned to any client.
- The full ID number is never included in any API response rendered to the browser. Only the masked format (`XX****XXX`) appears in the UI.
- The `verifyDob` function returns only `{ verified: true, record: { safeFields } }` — never the raw document.
- Subscriber contacts (phone numbers and emails) are stored only to send one-time collection alerts. They are not shared or used for any other purpose.

---

## Scaling notes

The `ids` collection is designed to hold approximately 490,000 documents at launch and will grow over time. All public lookups use `getDoc(doc(db, 'ids', idNumber))` — an O(1) read by document ID that is unaffected by collection size. No full-collection scans or `where` name queries are used anywhere in the public flow.

Admin queries filter by `addedBy` (the admin's UID) using a composite index on `(addedBy, addedAt)`. Each admin sees only their own records, keeping result sets manageable.

---

## Licence

Government civic infrastructure. All rights reserved.
