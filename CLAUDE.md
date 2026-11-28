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
  -> sign in with phone + SMS code (admin-otp: code sent only to numbers in
     admin_users; verify_gate locks out after 5 tries / 15 min)
  -> every call: POST admin-api with the user's access token
Admin-api (edge function, project rrbmjiilxlkspsnhbpve = prod)
  -> 1. valid session?
  -> 2. user in admin_users?  (deny by default)
  -> 3. rate limit
  -> 4. typed action, zod-validated input
  -> 5. reads/writes with the server's privileged key, then an audit row
```

Note: `rrbmjiilxlkspsnhbpve` is now named advicesahi-prod. It is the live
production project, not staging.

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
6. **IRDAI approvals** (`/irdai`, added 2026-11-28): advisors with an IRDAI number, pending first, licence document link when uploaded, phones masked. Approve (with a note) sets `advisor_profiles.verified`. Changing the number later resets it (DB trigger, mobile migration 0098). Kanchan is emailed whenever a number is added or changed.

## Definitions (confirmed by founder)

- **Ghost advisor:** signed up more than 10 days ago and added zero clients in their first 10 days after signing up.
- **Matched client:** a client who has a lead with an advisor (has chosen an advisor).
- **Current advisor:** a lead that is not lost or expired.
- **Past advisor:** any other connection, including ones withdrawn or disconnected.

## Security rules (non-negotiable)

- Admin rights come only from the `admin_users` list in the staging project. Account type confers nothing.
- The browser never holds a database service key. Only `admin-api` does.
- Sign-in is phone + SMS code (founder decision 2026-11-10, replacing phone +
  password). reCAPTCHA and MFA step-up were built, then paused the same day;
  `admin-login-captcha` is still deployed if they come back.
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

- Built: login, dashboard, advisors (list, detail, subscription actions, photos), clients (list, detail), reports (list, detail), security incidents, and the security headers.
- **Live since 2026-11-23** at `https://admin.advicesahi.com` (Vercel project
  `advicesahi-administrator`, team argusfintechs-projects, deploys from
  `main`). Hostinger DNS: CNAME `admin` → `1463912779b9f0a6.vercel-dns-016.com`
  plus a `_vercel` TXT verification record. Env vars: `NEXT_PUBLIC_SUPABASE_URL`
  (prod + preview), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (prod). `vercel.json` pins
  the framework to Next.js; the project's preset had been "Other", which is
  why every deploy since 2026-10-05 failed. The URL env var was also an invalid
  value until 2026-11-23.
- `advicesahi-administrator.vercel.app` also serves the UI publicly, but
  admin-api and admin-otp only accept the two allowlisted origins, so login
  can't work there.
- Not yet built: the access gate in front of the host, and the external penetration test before real data is used.
