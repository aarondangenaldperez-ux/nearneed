# NearNeed

**Find help. Offer help. Get things done.**

NearNeed is a Philippines-focused, request-first local services marketplace concept. The working hypothesis is that customers should be able to describe a task in their own words and compare relevant offers from providers serving the same area.

## Current status

**Early MVP foundation — not a live marketplace.**

The repository contains:
- a responsive frontend prototype with example service categories and a local-only request preview;
- a product strategy and public competitor scan;
- pilot MVP requirements and acceptance criteria;
- a controlled pilot and validation plan;
- a starter Supabase/Postgres schema with initial Row Level Security policies;
- baseline browser security headers and a GitHub Actions lint/build workflow.

The homepage search uses example data. The request form does not transmit or save anything. The Supabase migration has **not** been applied to a project, and the app is **not** connected to Supabase. Authentication, real request persistence, provider feeds, offers, reporting operations, notifications, payments, deployment, and live moderation remain incomplete.

## Strategic focus

Do not launch nationwide or across every service category at once. Local competitors already market service catalogues, job posting, quote comparison, provider checks, messaging, and booking. NearNeed must validate a specific unmet use case and a focused launch area before expanding.

Read:
- [Product strategy](docs/PRODUCT_STRATEGY.md)
- [MVP requirements](docs/MVP_REQUIREMENTS.md)
- [Data model and security](docs/DATA_MODEL_AND_SECURITY.md)
- [Pilot plan](docs/PILOT_PLAN.md)

## Run locally

Requirements: Node.js 22 or later and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The CI workflow runs lint and production-build checks on pushes and pull requests to `main`. A lockfile has not yet been generated, and CI has not yet been observed passing.

## Supabase starter migration

The initial schema is at:

`supabase/migrations/0001_initial_schema.sql`

It is intended for a **new Supabase project after review**. Do not apply it to an existing database without checking for conflicts. Test all RLS policies with separate customer and provider accounts before using real information. See [Data model and security](docs/DATA_MODEL_AND_SECURITY.md).

## Security and privacy

- Never commit API keys, passwords, service-role keys, government IDs, private customer data, or interview notes.
- Use an untracked `.env.local` for local configuration.
- The Supabase service-role key must remain server-only.
- The prototype should not collect real personal data.
- Do not expose exact addresses or private contact details in public requests.
- Do not claim that a provider is verified unless a defined review has actually been completed.

Before a public pilot, prepare accurate terms, community rules, a privacy notice, support and moderation procedures, security testing, and an incident process. This repository is not a legal or security compliance certification.
