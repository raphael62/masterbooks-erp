# MasterBooks ERP

Multi-company, multi-location ERP with online/offline capabilities. Built with React, Vite, and Supabase.

## Features

- **Multi-company & multi-location** – Companies, locations, and context selector with IndexedDB caching
- **Online/offline** – Session and company/location data cached for offline use
- **Supabase** – Auth, PostgreSQL database, and Edge Functions
- **Modules** – Sales, purchases, inventory, production, finance, HR, and more

## Prerequisites

- Node.js (v14+)
- Supabase account

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `VITE_SUPABASE_URL` – Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – Your Supabase anon/public key

3. **Run Supabase migrations:**
   - In Supabase Dashboard: Project Settings → SQL Editor, or
   - CLI: `npx supabase db push` (after linking: `npx supabase link`)

4. **Create a Super User:**
   ```bash
   # Add SUPABASE_SERVICE_ROLE_KEY to .env (Supabase → Settings → API → service_role)
   npm run create-super-user
   # Or: node scripts/create-super-user.js admin@company.com YourPassword "Admin Name"
   ```

5. **Start the dev server:**
   ```bash
   npm start
   ```
   App runs at http://localhost:4028

## Connecting to Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy Project URL and anon key from Settings → API
3. Add them to `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Run migrations from `supabase/migrations/` (in order) in the SQL Editor
5. Create at least one user in Authentication → Users

## Project Structure

```
masterbooks_erp/
├── src/
│   ├── components/    # Shared UI (Header, Sidebar, etc.)
│   ├── contexts/      # AuthContext, CompanyLocationContext, ThemeContext
│   ├── lib/           # Supabase client
│   ├── pages/         # Feature pages
│   └── utils/         # Helpers
├── supabase/
│   ├── migrations/    # SQL migrations
│   └── functions/     # Edge Functions
├── .env               # Environment variables
└── package.json
```

## Scripts

- `npm start` – Dev server (Vite)
- `npm run build` – Production build
- `npm run serve` – Preview production build
- `npm run create-super-user` – Create admin user (requires SUPABASE_SERVICE_ROLE_KEY in .env)

## Tech Stack

- React 18, Vite, Tailwind CSS
- Supabase (Auth + PostgreSQL)
- IndexedDB for offline caching
- Redux Toolkit, React Router v6
