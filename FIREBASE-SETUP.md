# 🔥 TellSafe — Firebase Setup Guide

Step-by-step instructions for every click. Should take about 15 minutes.

---

## Step 1: Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Sign in with your Google account
3. Click the big **"Create a project"** button (or "Add project")
4. Enter project name: **TellSafe**
   - Firebase will suggest a project ID like `tellsafe-abcd1` — that's fine
   - Note this ID, you'll need it later
5. **Disable Google Analytics** (toggle it off) — you don't need it
6. Click **"Create project"**
7. Wait ~30 seconds, then click **"Continue"**

You're now in the Firebase Console dashboard.

---

## Step 2: Register a Web App

This gives you the config values your code needs.

1. On the project dashboard, click the **web icon** `</>` (it's in the center of the page, next to iOS and Android icons)
2. App nickname: **tellsafe-web**
3. ☐ Do NOT check "Also set up Firebase Hosting" (we're using Vercel)
4. Click **"Register app"**
5. You'll see a code block with `firebaseConfig`. **Copy these values:**

```
apiKey: "AIza..."          → NEXT_PUBLIC_FIREBASE_API_KEY
authDomain: "tellsafe-xxx.firebaseapp.com"  → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
projectId: "tellsafe-xxx"  → NEXT_PUBLIC_FIREBASE_PROJECT_ID
storageBucket: "tellsafe-xxx.appspot.com"   → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
messagingSenderId: "123..."  → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
appId: "1:123:web:abc..."   → NEXT_PUBLIC_FIREBASE_APP_ID
```

6. Click **"Continue to console"**

---

## Step 3: Enable Authentication

1. In the left sidebar, click **"Build"** to expand it
2. Click **"Authentication"**
3. Click **"Get started"**
4. You'll see a list of sign-in providers
5. Click **"Email/Password"** (first in the list)
6. Toggle **"Enable"** to ON
7. Leave "Email link (passwordless sign-in)" disabled
8. Click **"Save"**

✅ Authentication is ready.

---

## Step 4: Create Firestore Database

1. In the left sidebar under Build, click **"Firestore Database"**
2. Click **"Create database"**
3. A modal appears:
   - Select **"Start in production mode"** (our security rules handle access)
   - Click **"Next"**
4. Choose a location:
   - Select **`us-east1` (South Carolina)** — closest to Orlando
   - ⚠️ This cannot be changed later
5. Click **"Enable"**
6. Wait ~30 seconds for provisioning

You'll see an empty database. That's correct — the app creates collections automatically when you sign up and submit feedback.

✅ Firestore is ready.

---

## Step 5: Enable Cloud Storage

1. In the left sidebar under Build, click **"Storage"**
2. Click **"Get started"**
3. A modal appears with default security rules
   - Click **"Next"** (we'll deploy our own rules)
4. Storage location should match your Firestore location (`us-east1`)
   - If it's pre-selected, just click **"Done"**

✅ Storage is ready (this is where org logos get uploaded).

---

## Step 6: Upgrade to Blaze Plan (Required for Cloud Functions)

Cloud Functions won't work on the free Spark plan. But Blaze is pay-as-you-go and you won't be charged anything at your scale (generous free tier).

1. In the bottom-left corner of the Firebase Console, you'll see **"Spark plan"**
   - Or click the ⚙️ gear icon → **"Usage and billing"**
2. Click **"Upgrade"** or **"Modify plan"**
3. Select **"Blaze (pay as you go)"**
4. Add a payment method (credit card)
5. Optionally set a **budget alert** at $5/month (you won't hit it, but nice to have)
6. Click **"Purchase"**

💡 **Cost reality:** At your scale, you'll stay well within the free tier limits:
- Firestore: 50K reads/day, 20K writes/day free
- Functions: 2M invocations/month free
- Storage: 5GB free
- Auth: 50K monthly active users free

✅ Blaze plan active.

---

## Step 7: Download Service Account Key

This is the private key that lets your server-side code (Cloud Functions, Next.js API routes) talk to Firebase with admin privileges.

1. Click the **⚙️ gear icon** next to "Project Overview" in the top-left
2. Click **"Project settings"**
3. Click the **"Service accounts"** tab (at the top)
4. You'll see a section for Firebase Admin SDK
5. Make sure **"Node.js"** is selected
6. Click **"Generate new private key"**
7. Click **"Generate key"** in the confirmation dialog
8. A `.json` file downloads — **keep this safe, it's your master key**

Now open that JSON file and you need to get the contents into your `.env.local`:

**Option A (quick & dirty):** Open the JSON file, select all, copy. Then in `.env.local`:
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tellsafe-xxx",...}
```
Paste the entire JSON on one line (remove line breaks).

**Option B (cleaner):** Run this in your terminal:
```bash
cat path/to/your-downloaded-key.json | tr -d '\n' | pbcopy
```
This copies the minified JSON to your clipboard. Paste it as the value.

✅ Service account key ready.

---

## Step 8: Enable Cloud Functions

1. In the left sidebar under Build, click **"Functions"**
2. If prompted, click **"Get started"**
3. It may ask you to upgrade to Blaze (you already did in Step 6)
4. Click **"Continue"**
5. You don't need to deploy from the console — we'll deploy from the terminal

✅ Functions enabled.

---

## Step 9: Set Up Firestore Indexes (from your terminal)

Back in your terminal, in the tellsafe project directory:

```bash
# Make sure you're logged into Firebase CLI
firebase login

# Set the active project
firebase use tellsafe-xxx   # replace with your project ID

# Deploy security rules + indexes
firebase deploy --only firestore
firebase deploy --only storage
```

You should see:
```
✔  firestore: Released rules
✔  firestore: Deployed indexes
✔  storage: Released rules
```

✅ Database rules and indexes deployed.

---

## Step 10: Verify Everything Works

Your `.env.local` should now look like this (with real values):

```bash
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tellsafe-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tellsafe-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tellsafe-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (the JSON from Step 7)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tellsafe-xxx",...}

# Encryption key (generated by setup.sh or manually)
TELLSAFE_RELAY_ENCRYPTION_KEY=a1b2c3...64characters...

# Leave these blank for now
SENDGRID_API_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Now start the dev server:

```bash
npm run dev
```

Open **http://localhost:3000/auth/signup** and:
1. Create an account (any email/password)
2. Name your org "West Orlando Westies", slug "wow"
3. You should land on the admin dashboard
4. Open **http://localhost:3000/wow** in another tab
5. Submit a test feedback
6. Switch back to the admin tab — it should appear in real-time

---

## Quick Reference: What's Where in Firebase Console

| Service | Left Sidebar Location | What TellSafe Uses It For |
|---------|----------------------|---------------------------|
| Authentication | Build → Authentication | Admin login/signup |
| Firestore | Build → Firestore Database | All data storage |
| Storage | Build → Storage | Logo uploads |
| Functions | Build → Functions | Email relay, sentiment, notifications |
| Project Settings | ⚙️ gear icon | API keys, service account |
| Usage & Billing | ⚙️ → Usage and billing | Monitor costs |

---

## Troubleshooting

**"Permission denied" errors in the app:**
→ Your Firestore security rules may not have deployed. Run `firebase deploy --only firestore` again.

**"No Firebase app" error:**
→ Check that ALL 6 `NEXT_PUBLIC_FIREBASE_*` values are set in `.env.local`. Restart `npm run dev` after changes.

**"Could not reach Cloud Firestore backend":**
→ Make sure you selected a Firestore location in Step 4. Check that the project ID in `.env.local` matches your Firebase project.

**Service account errors:**
→ Make sure the JSON is on ONE line in `.env.local` with no line breaks. Check for accidental whitespace.

**Functions won't deploy:**
→ Make sure you're on the Blaze plan (Step 6). Run `cd functions && npm install && cd ..` then `firebase deploy --only functions`.

**Auth "email already in use":**
→ You already signed up with that email. Go to Firebase Console → Authentication → Users tab to see/delete test accounts.

---

## What You DON'T Need to Do in Firebase Console

- ❌ Don't manually create any Firestore collections (the app creates them)
- ❌ Don't set up Firebase Hosting (we're using Vercel)
- ❌ Don't configure Firebase Extensions
- ❌ Don't set up Firebase Crashlytics or Analytics
- ❌ Don't touch Remote Config or A/B Testing
