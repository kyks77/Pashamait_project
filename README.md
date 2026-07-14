# novo

Freelance document generator for solo developers and designers. Create contracts, invoices, and proposals with flexible terms, secured by personal accounts and subscriptions.

## Structure

```text
superproject/
+-- frontend/          # Static pages: landing, generate, auth, profile, admin
|   +-- css/
|   +-- js/
|   +-- *.html
+-- backend/           # Node.js API: Express + SQLite via sql.js
    +-- db/
    +-- middleware/
    +-- routes/
    +-- server.js
```

Frontend and backend are separated for security: auth, subscriptions, and admin actions run server-side only.

## Features

- Landing page: intro, features, pricing
- Document generator: contracts, invoices, and proposals with expanded options
- Accounts: register, login, profile, display name, email, password
- Subscriptions: monthly ($9) or yearly ($79), tied to user accounts
- Admin dashboard: view users, suspend accounts, monitor activity log

## Quick Start

```bash
# Install root dev tools and backend dependencies
npm run install:all

# Copy env if backend/.env does not exist yet
copy backend\.env.example backend\.env

# Edit JWT_SECRET and ADMIN_PASSWORD in backend/.env

# Initialize database and create the default admin if needed
npm run init-db

# Run both servers
npm run dev
```

Open http://localhost:3000

The API runs on http://localhost:3001.

Default admin:

- Email: `admin@novo.app` or `ADMIN_EMAIL` in `backend/.env`
- Password: value of `ADMIN_PASSWORD` in `backend/.env`

Change the admin password immediately after first login.

## Production

```bash
npm run install:all
npm start
```

In production mode the backend serves `frontend/` directly, so open http://localhost:3001 unless you set a different `PORT`.

Set `FRONTEND_URL`, `JWT_SECRET`, and Stripe environment variables when you are ready for live payments.

## Legal

Generated templates are for convenience, not legal advice.
