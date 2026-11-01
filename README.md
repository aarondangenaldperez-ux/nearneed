# NearNeed

**Find help. Offer help. Get things done.**

NearNeed is a Philippines-focused, request-first local services marketplace concept. Its working hypothesis is that customers should be able to describe a task in their own words and compare relevant offers from providers serving the same area.

## Current status

**MVP application foundation — not a live public marketplace.**

The repository contains:
- a responsive homepage with example service categories and a clearly labelled, local-only request preview;
- Supabase SSR authentication scaffolding (email/password sign-in, invite-gated registration, email confirmation, and session refresh);
- a customer/provider dashboard with request creation, provider profiles, service listings, offers, and offer decisions;
- a starter PostgreSQL schema with Row Level Security (RLS) policies for seven application tables;
- a product strategy, competitor scan, pilot requirements, data/security notes, and validation plan;
- baseline browser security headers and GitHub Actions lint/build workflow.

The live data flows are **not connected or verified yet**. A Supabase project must be created, the migration reviewed/applied, email confirmation configured, and the project URL/publishable key set in local/deployment environment variables. The registration gate remains closed unless a server-only pilot invite code is configured. Do not open registration until privacy notice, terms, reporting, moderation, and support procedures are ready.

The homepage search still uses example data. Its sample request preview is local-only and does not transmit or save the text. The dashboard uses Supabase server-side operations and database RLS, but it will not work until the backend is configured.

## Strategic focus

Do not launch nationwide or across every service category at once. Philippine competitors already market service catalogues, customer job posts, quote comparison, provider checks, messaging, and booking. NearNeed must validate a specific unmet use case and a focused launch area before expanding.

Read:
- [Product strategy](docs/PRODUCT_STRATEGY.md)
- [MVP requirements](docs/MVP_REQUIREMENTS.md)
- [Data model and security](docs/DATA_MODEL_AND_SECURITY.md)
- [Pilot plan](docs/PILOT_PLAN.md)
- [Development workflow and continuity](docs/DEVELOPMENT_WORKFLOW.md)
- [Current project status](docs/PROJECT_STATUS.md)

## Run locally

Requirements: Node.js 22.13 or later and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

GitHub Actions runs dependency installation, lint, and a Next.js production build on pushes and pull requests to `main`. Run 53 passed those checks on 1 November 2026. A PostgreSQL migration/RLS validation gate has now been added; its first result is pending. A committed npm lockfile is still missing.

## Supabase setup

1. Create a Supabase project under the responsible adult/project owner.
2. Review `supabase/migrations/0001_initial_schema.sql` before applying it to a new project.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in the local/deployment environment.
4. Configure the Supabase Auth Site URL and allow-listed redirect URL to include `/auth/confirm`.
5. Test email confirmation, sign-in/out, and RLS with separate customer and provider accounts.
6. Keep `NEED_PILOT_INVITE_CODE` unset until the pilot is ready. When needed, configure a strong random value as a server-only environment variable; never use a `NEXT_PUBLIC_` prefix for it.
7. Never put a Supabase service-role or secret key in browser code or a public repository.

The app uses `@supabase/ssr` cookie-based sessions. On Next.js 16, Supabase session refresh runs in the root `proxy.ts` convention.

## Security and privacy

- Never commit API keys, passwords, service-role keys, government IDs, private customer data, or interview notes.
- Never expose exact addresses or private contact details in public requests.
- Provider profiles are self-published and are **not identity-verified**.
- Database grants and RLS policies are both required; UI hiding is not an authorization boundary.
- Do not collect real personal data before accurate privacy terms, retention rules, moderation, support, and incident procedures are ready.
- The controlled pilot is adult-only. The project owner should manage pilot invitations and obtain appropriate adult oversight for business, contracting, and payment decisions.

This repository is not a legal or security compliance certification. The SQL migration and app integration must be tested against a real Supabase project before use with real people.
