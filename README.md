<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Sanity-CMS-F36458?logo=sanity&logoColor=white" alt="Sanity" />
  <img src="https://img.shields.io/badge/Netlify-hosted-00C7B7?logo=netlify&logoColor=white" alt="Netlify" />
</p>

# Give Back Jojo

The website for Give Back Jojo, a non-profit for mental health awareness and suicide prevention. It shares crisis resources, articles, events and tributes, and sends visitors to Zeffy to shop or donate.

**Live at [givebackjojo.org](https://givebackjojo.org)**

---

## Features

- **Articles** — Written and published in Sanity Studio, with optional anonymous bylines
- **Tribute Gallery** — Memorial pages honoring loved ones
- **Events** — Listings with date, location and venue details
- **Crisis Resources** — Quick-access hotline numbers and mental health resources
- **Shop** — Product catalog from Sanity; purchases happen on [Zeffy](https://www.zeffy.com/en-US/ticketing/give-back-swag)
- **Donate** — Donations happen on [Zeffy](https://www.zeffy.com/en-US/donation-form/jojos-generosity), with Venmo and Zelle as alternatives
- **Get Involved** — Volunteer form sent with EmailJS

There are no user accounts, and the site does not take payments or store personal data itself.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18 (Create React App), React Router v6, Styled Components, Framer Motion |
| **CMS** | Sanity (GROQ queries, Portable Text, image pipeline) — Studio lives in `gb-jojo/` |
| **Payments & donations** | Zeffy (external links) |
| **Forms** | EmailJS |
| **Monitoring** | Sentry |
| **Hosting** | Netlify |

---

## Project Layout

```
src/
├── App.js                 Routes and layout
├── constants.js           Shared constants, including the Zeffy links
├── sanityClient.js        Read-only Sanity client and article queries
└── components/            Pages and UI
gb-jojo/                   Sanity Studio (schemas, one-off scripts)
netlify.toml               Build settings and security headers
```

---

## Getting Started

### Install

```bash
git clone https://github.com/FelipeCantu/bg-jojo.git
cd bg-jojo
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
REACT_APP_SANITY_PROJECT_ID=your_sanity_project_id
REACT_APP_SANITY_DATASET=production
REACT_APP_EMAILJS_SERVICE_ID=your_emailjs_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
REACT_APP_EMAILJS_USER_KEY=your_emailjs_user_key
REACT_APP_SENTRY_DSN=your_sentry_dsn
```

The Sanity dataset is public and read-only from the site, so no Sanity token is needed (or should ever be added here).

### Run Locally

```bash
npm start            # Dev server on http://localhost:3000
```

### Sanity Studio

```bash
cd gb-jojo
npm install
npm run dev          # Studio on http://localhost:3333
npm run deploy       # Publish Studio changes
```

### Deploy

Netlify builds the site from the main branch with `npm run build` (see `netlify.toml`).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm test` | Run tests |

---

## License

Proprietary software built for the Give Back Jojo non-profit organization.

---

<p align="center">
  <i>Every line of code supports mental health awareness and suicide prevention.</i>
</p>
