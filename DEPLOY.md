# 🚀 TellSafe — Deployment Checklist

Follow these steps in order. Total time: ~45 minutes.

---

## Step 1: Initialize the project (5 min)

```bash
# Create a new directory and copy all the TellSafe files into it
mkdir tellsafe && cd tellsafe

# Initialize git
git init

# Install dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

---

## Step 2: Create Firebase project (5 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `tellsafe` → disable Google Analytics (not needed)
3. Once created, enable these services:

**Authentication:**
- Click **Build → Authentication → Get started**
- Enable **Email/Password** sign-in method

**Firestore:**
- Click **Build → Firestore Database → Create database**
- Choose **Start in production mode**
- Select region: `us-east1` (closest to Orlando)

**Storage:**
- Click **Build → Storage → Get started**
- Accept default rules (we'll deploy our own)

**Functions (requires Blaze plan):**
- Click **Build → Functions → Get started**
- You'll need to upgrade to Blaze (pay-as-you-go) plan
- Don't worry — you won't be charged until you exceed free tier limits
- Free tier includes 2M invocations/month, which is more than enough

4. Register a web app:
- Click **Project settings → General → Add app → Web**
- Name: `tellsafe-web`
- Copy the `firebaseConfig` values — you'll need them for `.env.local`

---

## Step 3: Set up Firebase CLI (3 min)

```bash
npm install -g firebase-tools
firebase login
firebase use --add    # select your tellsafe project
```

---

## Step 4: Configure environment variables (5 min)

```bash
cp .env.example .env.local
```

Fill in the values:

```bash
# From Firebase Console → Project Settings → Web App
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tellsafe-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tellsafe-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tellsafe-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin — download from:
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# Paste the ENTIRE JSON file contents (minified) as the value
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Generate encryption key:
npm run generate:key
# Paste the output here:
TELLSAFE_RELAY_ENCRYPTION_KEY=paste-64-char-hex-here

# App URL (update after Vercel deploy)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**SendGrid and Anthropic can wait** — the app works without them, you just won't get emails or sentiment analysis. Add them when you're ready.

---

## Step 5: Deploy Firebase rules + indexes (2 min)

```bash
firebase deploy --only firestore
firebase deploy --only storage
```

---

## Step 6: Test locally (5 min)

```bash
npm run dev
```

1. Open `http://localhost:3000/auth/signup`
2. Create an account + organization (e.g., "West Orlando Westies" / slug: "wow")
3. Open `http://localhost:3000/wow` — you should see your branded feedback form
4. Submit a test feedback
5. Open `http://localhost:3000/admin` — you should see it in the inbox

---

## Step 7: Deploy to Vercel (5 min)

1. Push to GitHub:
```bash
git add .
git commit -m "Initial TellSafe launch"
git remote add origin https://github.com/YOUR_USERNAME/tellsafe.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo

3. In Vercel project settings, add ALL environment variables from `.env.local`
   - Go to **Settings → Environment Variables**
   - Add each one (Vercel will encrypt them)

4. Deploy. Vercel will build and give you a URL like `tellsafe.vercel.app`

5. Update `NEXT_PUBLIC_APP_URL` in Vercel to your actual URL

---

## Step 8: Deploy Cloud Functions (5 min)

```bash
# Set environment config for Cloud Functions
firebase functions:config:set \
  sendgrid.api_key="SG.your-key" \
  encryption.relay_key="your-64-char-hex" \
  anthropic.api_key="sk-ant-your-key"

# Deploy
npm run deploy:functions
```

---

## Step 9: Custom domain (optional, 10 min)

1. Buy `tellsafe.app` from Namecheap, Google Domains, or Cloudflare
2. In Vercel: **Settings → Domains → Add** → `tellsafe.app`
3. Add the DNS records Vercel gives you
4. Update `NEXT_PUBLIC_APP_URL` to `https://tellsafe.app`

---

## Step 10: SendGrid setup (when ready for emails)

1. Create account at [sendgrid.com](https://sendgrid.com)
2. **Settings → Sender Authentication** → verify your domain
3. **Settings → API Keys** → create key with "Mail Send" permission
4. Add `SENDGRID_API_KEY` to both `.env.local` and Vercel env vars
5. **For inbound relay emails:**
   - **Settings → Inbound Parse → Add Host & URL**
   - Receiving domain: `tellsafe.app`
   - Destination URL: `https://tellsafe.app/api/webhooks/sendgrid`
   - Check "POST the raw, full MIME message"
6. Add an MX record to your DNS: `mx.sendgrid.net` priority 10

---

## Step 11: Stripe setup (when ready for payments)

1. Create account at [stripe.com](https://stripe.com)
2. Create 3 Products:
   - **TellSafe Community** — $4.99/month recurring
   - **TellSafe Pro** — $9.99/month recurring
3. Add API keys to env vars
4. Set up webhook endpoint: `https://tellsafe.app/api/webhooks/stripe`
5. Build the Stripe checkout integration (I can help with this next)

---

## Launch Order Summary

| Priority | What | When |
|----------|------|------|
| ✅ Now | Steps 1-7 — working app with feedback + admin | Today |
| 📧 Soon | Steps 8+10 — email notifications + relay | This week |
| 💳 Later | Step 11 — payments | When you have users |
| 🌐 Optional | Step 9 — custom domain | When you buy the domain |

You can launch Steps 1-7 today and have a fully working feedback system for WOW by Tuesday night's social. The relay emails and payments can come after.
