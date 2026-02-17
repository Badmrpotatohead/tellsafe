# 🛡️ TellSafe — Anonymous Feedback for Communities

Anonymous feedback platform with three privacy modes and encrypted email relay. Built for dance communities, dojos, churches, clubs, and any organization that wants honest feedback from its members.

## Architecture

```
tellsafe/
├── app/                          # Next.js 14 App Router
│   ├── api/webhooks/sendgrid/    # Inbound email relay handler
│   ├── [orgSlug]/                # Public feedback form
│   ├── admin/                    # Admin dashboard (protected)
│   └── auth/                     # Login/signup
├── components/                   # React components
├── firestore/                    # Security rules + indexes
├── functions/src/                # Firebase Cloud Functions
├── lib/
│   ├── firebase.ts               # Client SDK init
│   ├── firebase-admin.ts         # Server SDK init
│   ├── data.ts                   # All Firestore operations
│   ├── encryption.ts             # AES-256-GCM email encryption
│   ├── sendgrid.ts               # Email templates + sending
│   └── sentiment.ts              # Claude API sentiment analysis
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Tech Stack

| Layer      | Technology                  | Cost at Launch |
|------------|-----------------------------|---------------|
| Frontend   | Next.js 14 on Vercel        | $0            |
| Database   | Firebase Firestore          | $0 (Spark)    |
| Auth       | Firebase Authentication     | $0            |
| Storage    | Firebase Storage (logos)    | $0            |
| Functions  | Firebase Cloud Functions    | $0 (Spark)    |
| Email      | SendGrid                    | $0 (100/day)  |
| Sentiment  | Claude API (Sonnet)         | ~$0.01/analysis |
| Payments   | Stripe                      | 2.9% + $0.30  |

## Setup

### 1. Firebase Project
```bash
npm install -g firebase-tools
firebase login
firebase init firestore functions storage
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in all values — see comments in .env.example
```

### 3. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste result into TELLSAFE_RELAY_ENCRYPTION_KEY
```

### 4. SendGrid Setup
1. Create account at sendgrid.com
2. Verify sender domain (tellsafe.app)
3. Enable Inbound Parse: Settings → Inbound Parse → Add Host
   - Domain: tellsafe.app
   - URL: https://tellsafe.app/api/webhooks/sendgrid
4. Create API key with "Mail Send" permission

### 5. Deploy
```bash
# Deploy Firestore rules + indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy frontend (auto via Vercel Git integration)
git push origin main
```

## Pricing Tiers

| Feature              | Free | Community ($4.99) | Pro ($9.99) |
|----------------------|------|-------------------|-------------|
| Submissions/month    | 25   | Unlimited         | Unlimited   |
| Anonymous relay      | ✗    | ✓                 | ✓           |
| QR code generator    | ✗    | ✓                 | ✓           |
| Custom branding      | ✗    | ✗                 | ✓           |
| Admin accounts       | 1    | 2                 | 5           |
| Sentiment analysis   | ✗    | ✗                 | ✓           |
| Response templates   | ✗    | ✗                 | ✓           |
| CSV export           | ✗    | ✗                 | ✓           |
| Analytics dashboard  | ✗    | Basic             | Full        |

## Data Flow: Anonymous Relay

```
Member submits feedback (relay mode)
  → Client sends plaintext email + feedback to Firestore
  → Cloud Function triggers:
      1. Encrypts email with AES-256-GCM
      2. Deletes plaintext email from document
      3. Creates relay thread
      4. Sends confirmation email to member
      5. Runs sentiment analysis (Pro)
      6. Notifies admins

Admin replies in dashboard
  → Message saved to thread subcollection
  → Cloud Function triggers:
      1. Decrypts member email server-side
      2. Sends reply via SendGrid (from: noreply@tellsafe.app)
      3. Reply-to: relay+{threadId}@tellsafe.app

Member replies to email
  → SendGrid Inbound Parse → /api/webhooks/sendgrid
  → Webhook extracts threadId from address
  → Strips quoted email text
  → Adds message to Firestore thread
  → Admin sees it in real-time (onSnapshot)
```
