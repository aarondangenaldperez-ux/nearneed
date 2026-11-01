# NearNeed project status

**Last reviewed:** 1 November 2026  
**Source of truth:** GitHub `main` and the workflow run for its latest commit  
**Latest verified code/workflow commit:** `1adc39de7072d2bd7cfe9d7de9545a125fd7b926`  
**Product state:** MVP engineering foundation; not production-ready

## 1. Completed and verified

- [x] Connected GitHub tools can read and write this repository; file updates are saved as Git commits.
- [x] Existing Next.js application inspected; the homepage and responsive styling were preserved.
- [x] Product strategy, competitor scan, MVP requirements, data/security notes, pilot plan, and development workflow are documented.
- [x] Supabase SSR authentication scaffolding, invite-gated adult registration, email confirmation callback, and customer/provider dashboard code are implemented.
- [x] Customer request, provider profile/service, provider offer, and customer offer-decision server actions are implemented.
- [x] PostgreSQL migration applies successfully to a disposable PostgreSQL 16 database in CI.
- [x] GitHub Actions run **#74** for commit `1adc39de7072d2bd7cfe9d7de9545a125fd7b926` passed dependency installation, ESLint, Next.js production build, PostgreSQL 16 migration, schema/RLS/trigger checks, and identity-based customer/provider authorization assertions.
- [x] The latest CI run's exact job and all 12 substantive execution steps were inspected; every step completed successfully.
- [x] CI executed behaviour-level RLS tests using separate customer/provider identities: public provider visibility, customer-owned request and report privacy, provider city/province/category matching, quote authorization, offer acceptance state transition, and prevention of withdrawing an accepted offer.

Latest verified run: https://github.com/aarondangenaldperez-ux/nearneed/actions/runs/41288976287

## 2. Implemented but awaiting verification

- [ ] Supabase SSR session and database integration against a real configured Supabase project.
- [ ] Registration, confirmation, sign-in, sign-out, invite gate, and recovery flows using real email delivery.
- [x] RLS authorization behaviour under distinct simulated customer/provider identities is checked in CI against disposable PostgreSQL.
- [ ] Repeat RLS authorization behaviour using actual Supabase Auth sessions and a configured Supabase project. The CI Auth schema is a lightweight stub, not the complete Supabase platform.
- [ ] End-to-end customer/provider journeys in a real browser.
- [ ] Production hosting behaviour, headers, environment configuration, backups, and monitoring.

## 3. Currently being developed / next engineering priorities

1. Validate the app's Supabase SSR/auth and database calls against a real configured Supabase project.
2. Add safe report submission UI and a restricted moderation process before any live user-generated content.
3. Add rate limits and anti-spam controls to account creation, requests, and offers.
4. Complete robust search/filtering and matching rules, including category, service mode, and location semantics.
5. Add accessibility and browser end-to-end tests for core customer/provider flows.

## 4. Not yet started

- Messaging and notification delivery.
- Reviews/reputation tied to confirmed completed work.
- Moderator/admin dashboard and auditable moderation actions.
- Advanced availability/preferences and geospatial discovery.
- Payment provider integration, subscriptions, commissions, or paid promotions.
- Production deployment, custom domain, monitoring, backup/restore, and incident drills.
- Locality/category market validation with adult customers and providers.

## 5. Blocked / requires external setup

- **Live backend:** no Supabase project is connected or configured through the available tools. A project owner must create/configure it and set the public URL/publishable key in deployment secrets. Never paste secrets into chat.
- **Local runtime:** direct clone from this ChatGPT runtime failed because it could not resolve `github.com`; local Node server and browser testing are not available here. GitHub Actions is the verified remote execution environment.
- **Repository privacy:** GitHub reports the repository is public. The available connected GitHub actions do not expose a visibility-settings update. The owner must change it manually in GitHub Settings before adding confidential project information.
- **Legal/business operations:** terms, privacy notice, moderation, support, retention, and any payment arrangements need appropriate adult owner review before real users or money are involved.

## Important scope statement

The homepage's search and service cards still use sample data; its request preview is local-only and does not save or send content. Dashboard code expects Supabase and is not live until a project is configured and tested. There is no live messaging, notification, review, admin, payment, or deployment system yet.

A green CI run proves the checks listed above passed. It does not prove a live production marketplace, real Supabase integration, complete authorization behaviour, or end-to-end browser correctness.
