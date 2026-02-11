<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-11.6-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Stripe-18.0-635BFF?logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Sanity-CMS-F36458?logo=sanity&logoColor=white" alt="Sanity" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
</p>

# Give Back Jojo

A full-stack non-profit platform for mental health awareness and suicide prevention. Provides free therapy access, educational resources, community engagement, and an e-commerce shop to fund the mission.

**Live at [givebackjojo.org](https://givebackjojo.org)**

---

## Features

### Content & Community
- **Articles** — Rich text editor (TipTap) with image uploads, anonymous posting, reading time, likes, views, and comments
- **Tribute Gallery** — Memorial pages honoring loved ones, managed through Sanity CMS
- **Events** — Listings with date, location, and venue details
- **Notifications** — Real-time alerts for likes and comments with user-configurable preferences
- **Crisis Resources** — Quick-access hotline numbers and mental health resources

### E-Commerce
- **Product Shop** — Categories (t-shirts, hoodies, plushies, stickers) with image zoom, size selection, and stock tracking
- **Persistent Cart** — Cart state survives page refreshes via localStorage
- **Dual Checkout** — Direct card payment or Stripe Checkout (Apple Pay / Google Pay)
- **Order History** — Past orders with status tracking, item details, and shipping info
- **Email Receipts** — Automatic Stripe-powered receipts on successful payment

### Donations
- **Flexible Giving** — Preset tiers ($10 – $5,000) or custom amounts with impact descriptions
- **Recurring Donations** — Monthly subscriptions with in-app management and cancellation
- **Multiple Methods** — Stripe, Venmo, and Zelle

### User Accounts
- **Authentication** — Email/password with verification, Google OAuth, Facebook OAuth
- **Account Settings** — Profile, wallet, address book, order history, notification preferences
- **Saved Wallet** — Stored payment methods with visual card previews

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, React Router v6, Styled Components, Framer Motion |
| **State** | React Context API (AuthContext, CartContext) |
| **Backend** | Firebase Cloud Functions (Node.js 20), Express |
| **Database** | Cloud Firestore |
| **Auth** | Firebase Authentication |
| **Payments** | Stripe (PaymentIntents, Checkout Sessions, Webhooks) |
| **CMS** | Sanity (GROQ queries, Portable Text, Image Pipeline) |
| **Hosting** | Firebase Hosting |

---

## Architecture

```
Frontend (React)
├── App.js                          Routes and layout
├── CartContext.js                   Cart state + localStorage persistence
├── context/AuthContext.js           Auth state provider
├── services/authService.js          Auth flows (email, Google, Facebook)
├── sanityClient.js                  Sanity CMS client + API methods
├── firestore.js                     Firebase client SDK setup
└── components/
    ├── CheckOutPage.js              Checkout UI and order creation
    ├── Donate.js                    Donation page with tiers
    ├── ArticleForm.js               Rich text article editor
    ├── ArticleDetail.js             Article view with comments
    ├── ProductPage.js               Product catalog and detail
    ├── settings/                    Account settings pages
    │   ├── MyWallet.js              Saved payment methods
    │   └── MyOrderHistory.js        Order history
    └── Navbar/
        ├── AccountSettings.js       Settings tab container
        └── Subscriptions.js         Recurring donation management

Backend (Firebase Cloud Functions)
└── functions/index.js               Express API: payments, checkout, webhooks
```

---

## Payment Flows

**Direct Card Payment**
```
CheckOutPage  ->  useStripePayment hook  ->  Cloud Function (createPaymentIntent)
    ->  Stripe API  ->  confirmCardPayment()  ->  Firestore order  ->  Success
```

**Stripe Checkout (Hosted Page)**
```
CheckOutPage  ->  useStripePayment hook  ->  Cloud Function (createCheckoutSession)
    ->  Stripe Hosted Page  ->  Webhook  ->  Firestore order  ->  Success
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/createPaymentIntent` | Direct card payment |
| `POST` | `/createCheckoutSession` | Stripe Checkout with Apple/Google Pay |
| `POST` | `/webhook` | Stripe webhook handler |
| `GET` | `/healthz` | Health check |

Callable functions (Firebase SDK): `createDonationPaymentIntent`, `createDonationCheckoutSession`, `cancelDonationSubscription`

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Stripe CLI (for local webhook testing)

### Install

```bash
git clone https://github.com/your-username/bg-jojo.git
cd bg-jojo
npm install
cd functions && npm install && cd ..
```

### Environment Variables

Create `.env` in the project root:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_SANITY_PROJECT_ID=your_project_id
REACT_APP_SANITY_DATASET=production
REACT_APP_SANITY_API_TOKEN=your_token
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Set Cloud Functions secrets:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### Run Locally

```bash
# React dev server
npm start

# Firebase emulators (separate terminal)
firebase emulators:start

# Stripe webhook forwarding (separate terminal)
stripe listen --forward-to localhost:5001/bg-jojo/us-central1/httpApi/webhook
```

### Deploy

```bash
npm run build
firebase deploy
```

---

## Firestore Data Model

```
users/{userId}
  ├── paymentMethods/{methodId}    # cardholderName, cardLast4, expiry, isDefault
  ├── displayName, email, photoURL, role
  └── notificationPrefs, providers[], lastLogin

orders/{orderId}
  └── items[], total, status, paymentMethod, shippingInfo, paymentId, userId

donations/{donationId}
  └── amount, status, frequency, stripePaymentIntentId, stripeSubscriptionId

notifications/{notificationId}
  └── type, senderId, receiverId, articleId, read, createdAt
```

---

## Testing Payments

Use Stripe test mode:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | 3D Secure required |

Any future expiry and any 3-digit CVC.

---

## Security

- All Stripe API calls are server-side only (Cloud Functions)
- Webhook signature verification on every event
- CORS origin whitelist
- Rate limiting (100 req / 15 min per IP)
- Card data: only last 4 digits stored, never full numbers
- Redirect URL validation against domain whitelist
- Firebase security rules on all Firestore collections
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `firebase deploy` | Deploy hosting + functions |
| `firebase emulators:start` | Local emulators |

---

## License

Proprietary software built for the Give Back Jojo non-profit organization.

---

<p align="center">
  <i>Every line of code supports mental health awareness and suicide prevention.</i>
</p>
