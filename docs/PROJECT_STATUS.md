# NearNeed project status

**Last reviewed:** 1 November 2026  
**Source of truth:** GitHub `main` and the latest applicable GitHub Actions run  
**Latest implementation commit:** `ec2ae68f0b0deda40679aa8b7fa7f61f6e65e975`  
**Product state:** MVP engineering foundation; not production-ready

## 1. Completed and verified

- [x] Connected GitHub tools can read and write this repository; changes are saved as Git commits.
- [x] Existing Next.js application and responsive homepage preserved.
- [x] Supabase SSR authentication scaffolding, invite-gated adult registration, email confirmation callback, and customer/provider dashboard code implemented.
- [x] Customer request, provider profile/service, provider offer, and offer-decision server actions implemented.
- [x] Initial PostgreSQL migration applies to disposable PostgreSQL 16 in CI.
- [x] CI run **#74** passed dependency installation, ESLint, Next.js production build, migration, schema/RLS/trigger checks, and simulated identity-based customer/provider authorization tests.
- [x] CI run #74 tested public provider visibility, customer-owned request/report privacy, provider city/province/category matching, quote permissions, offer acceptance transition, and prevention of withdrawing an accepted offer.
- [x] Added migration `0002_customer_request_status_guard.sql` to restrict customer status changes to cancelling their own open request. Customers cannot self-assign matched/completed or reopen a cancelled request.
- [x] Added a dedicated SQL regression test for request status transitions and wired the migration and test into CI.
- [x] CI run **#78** passed the request-status guard migration and regression test, along with lint, production build, and existing database authorization checks.
- [ ] Added migration `0003_quote_acceptance_guard.sql` to serialize offer acceptance, require the parent request to remain open, and prevent a second accepted offer. The one-winner regression test and CI trigger-count assertion are in place; final verification is pending.

Verified run #74: https://github.com/aarondangenaldperez-ux/nearneed/actions/runs/41288976287  
Verified request-status guard run #78: https://github.com/aarondangenaldperez-ux/nearneed/actions/runs/41291369075

## 2. Implemented but awaiting verification

- [ ] CI run #83 must complete successfully before the new quote-acceptance guard and one-winner regression test are marked verified.
- [ ] Supabase SSR session and database integration against a real configured Supabase project.
- [ ] Registration, confirmation, sign-in, sign-out, invite gate, and recovery flows using real email delivery.
- [x] RLS behaviour under separate simulated customer/provider identities is checked against disposable PostgreSQL.
- [ ] Repeat authorization tests using real Supabase Auth sessions; CI Auth is a lightweight stub, not the full Supabase platform.
- [ ] End-to-end customer/provider journeys in a real browser.
- [ ] Production hosting, headers, environment configuration, backups, and monitoring.

## 3. Next engineering priorities

1. Validate Supabase SSR/auth and database calls against a real configured Supabase project.
2. Add safe report submission UI and restricted moderation before live user-generated content.
3. Add rate limits and anti-spam controls to account creation, requests, and offers.
4. Complete robust search/filtering and matching, including category, service mode, and location semantics.
5. Add accessibility and browser end-to-end tests for core customer/provider journeys.
6. Generate and commit a reproducible npm lockfile.

## 4. Not yet started

- Messaging and notification delivery.
- Reviews/reputation tied to confirmed completed work.
- Moderator/admin dashboard and auditable moderation actions.
- Advanced availability/preferences and geospatial discovery.
- Payment provider integration, subscriptions, commissions, or paid promotions.
- Production deployment, custom domain, monitoring, backup/restore, and incident drills.
- Locality/category market validation with adult customers and providers.

## 5. Blocked / external setup required

- **Live backend:** no Supabase project is connected/configured. A responsible adult project owner must create/configure it and set the public URL and publishable key in the deployment environment. Never paste secrets into chat.
- **Local runtime:** direct clone from this ChatGPT runtime failed because it could not resolve `github.com`; local Node/browser testing is unavailable here. GitHub Actions is the remote execution environment.
- **Repository privacy:** GitHub reports the repository is public. The connected GitHub actions do not expose visibility-setting updates. The owner must change visibility manually in GitHub Settings before adding confidential project information.
- **Legal/business operations:** privacy terms, moderation, support, retention, and any payment arrangements need appropriate adult owner review before real users or money are involved.

## Important scope statement

The homepage search and service cards still use sample data; its request preview is local-only and does not save or send content. Dashboard code expects Supabase and is not live until a project is configured and tested. There is no live messaging, notification, review, admin, payment, or deployment system.

A green CI run proves only the checks that actually ran. It does not prove a live production marketplace, real Supabase integration, or end-to-end browser correctness.
