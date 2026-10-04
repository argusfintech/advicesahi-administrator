# CLAUDE.md — AdviceSahi Administrator (admin.advicesahi.com)

## Purpose

The internal admin dashboard for AdviceSahi. Staff use it to see platform
analytics, review advisors, look up clients and their reports and policies,
manage advisor subscriptions, and read support and policy-import tickets.
It is the most sensitive surface in the platform, so every rule below is
mandatory.

## Where it runs and what it connects to

- **UI:** this repo (Next.js 14, App Router). Intended host: `admin.advicesahi.com`.
  It is a separate app from the old web app on `dash.advicesahi.com`, which
  has its own unrelated `/admin` panel. Do not reuse that panel or its login.
- **Data:** the mobile/staging Supabase project `rrbmjiilxlkspsnhbpve`. This
  is where advisors, clients, leads, policies, reports, and tickets live.
- **Only path to data:** the `admin-api` edge function in that project. The UI
  never reads or writes tables directly.

```
Browser (admin UI)
  -> sign in with phone + password (Supabase Auth, staging project)
  -> every call: POST admin-api with the user's access token
Admin-api (edge function, staging project)
  -> 1. valid session?
  -> 2. user in admin_users?  (deny by default)
  -> 3. session created with a password? (rejects OTP sessions)
  -> 4. rate limit
  -> 5. typed action, zod-validated input
  -> 6. reads/writes with the server's privileged key, then an audit row
```

## Main features

1. **Dashboard:** summary cards.
   - Advisors: total, paid (active subscription), ghost.
   - Clients: total, matched (has a lead with an advisor), unmatched, with and without policies, with and without report.
   - Reports: total.
2. **Advisors:** list (name, city, category, listing status, plan, joined). Detail shows profile, subscriptions, clients (each opens the client), and recent support tickets.
3. **Subscription actions (advisor detail):**
   - Assign a complimentary subscription (tier + mandatory reason).
   - Set add-on lead credits (mandatory reason).
   - Cancel a subscription. The record is kept with status `cancelled` (mandatory reason).
4. **Clients:** searchable list (name, phone, date joined). Detail shows contact details (phone masked by default), reports, policies, advisors contacted (current and past), support tickets, and policy import tickets.
5. **Reports:** list and detail with the report content.

## Definitions (confirmed by founder)

- **Ghost advisor:** signed up more than 10 days ago and added zero clients in their first 10 days after signing up.
- **Matched client:** a client who has a lead with an advisor (has chosen an advisor).
- **Current advisor:** a lead that is not lost or expired.
- **Past advisor:** any other connection, including ones withdrawn or disconnected.

## Security rules (non-negotiable)

- Admin rights come only from the `admin_users` list in the staging project. Account type confers nothing.
- The browser never holds a database service key. Only `admin-api` does.
- Sign-in is phone + password. OTP sessions are refused by the server.
- Every read of client or advisor data writes an `admin_audit_log` row.
- Every change requires a written reason (5 or more characters), stored in the audit log.
- Changes never delete records. Cancelling sets a status.
- Phone numbers and policy numbers are masked by default.
- Admin pages send `no-store`, `noindex`, a strict CSP, and `frame-ancestors 'none'`.
- The API accepts requests only from its own origin allowlist (`localhost:3000` for development, `admin.advicesahi.com` for production).
- Secrets: no `SUPABASE_SECRET_KEY` or service key in this repo. Only the public publishable key is used in the UI. Never commit `.env.local`.
- Passwords are never written to code, migrations, or docs.

## Known constraints

- Admin login uses the staging project's Auth. Its phone number must not be
  a customer or advisor account. The current admin account is the founder's own number.
- Last-opened tracking is not built. It was deferred by the founder.
- Support tickets and policy import tickets are read-only for now.

## Running locally

```
npm install
cp .env.example .env.local   # then set NEXT_PUBLIC_SUPABASE_ANON_KEY to the staging publishable key
npm run dev                  # http://localhost:3000
```

## Status

- Built: login, dashboard, advisors (list, detail, subscription actions), clients (list, detail), reports (list, detail), and the security headers.
- Not yet built: Vercel project and `admin.advicesahi.com` DNS, the access gate in front of the host, and the external penetration test before real data is used.
