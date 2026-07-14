# novo

Freelance document generator for solo developers and designers. Create contracts, invoices, and proposals with flexible terms — secured by personal accounts and subscriptions.

## Structure

```
superproject/
├── frontend/          # Static pages (landing, generate, auth, profile, admin)
│   ├── css/
│   ├── js/
│   └── *.html
└── backend/           # Node.js API (Express + SQLite)
    ├── db/
    ├── middleware/
    ├── routes/
    └── server.js
```

Frontend and backend are separated for security: auth, subscriptions, and admin actions run server-side only.

## Features

- **Landing page** — intro, features, pricing
- **Document generator** — contracts, invoices, proposals with expanded options:
  - Payment: 10/90, 30/70, milestones, retainer, hourly, custom
  - Revisions, IP ownership, confidentiality, termination, warranty, scope changes
- **Accounts** — register, login, profile (email, password, display name)
- **Subscriptions** — monthly ($9) or yearly ($79), tied to user accounts
- **Admin dashboard** — view users, suspend accounts, monitor activity log

## Quick start

```bash
# Install dependencies
npm run install:all

# Copy env and set secrets
cp backend/.env.example backend/.env
# Edit JWT_SECRET and ADMIN_PASSWORD in backend/.env

# Initialize database (creates admin user)
npm run init-db

# Run both servers (API on :3001, frontend on :3000)
npm run dev
```

Open http://localhost:3000

**Default admin** (change immediately):
- Email: `admin@novo.app` (or `ADMIN_EMAIL` in `.env`)
- Password: value of `ADMIN_PASSWORD` in `.env`

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT in httpOnly cookies (not localStorage)
- Helmet, CORS, rate limiting on auth routes
- Admin can suspend users instantly
- Activity log for audit trail

## Production

```bash
NODE_ENV=production npm start
```

Serves frontend from backend in production. Set `FRONTEND_URL`, `JWT_SECRET`, and configure Stripe env vars when ready for live payments.

## Legal

Generated templates are for convenience, not legal advice.
