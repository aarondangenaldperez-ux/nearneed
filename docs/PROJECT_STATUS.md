# NearNeed project status

**Last reviewed:** 1 November 2026  
**Source of truth:** GitHub `main` and the latest applicable GitHub Actions run  
**Latest implementation commit:** `2e0f681a37ea2baebbd6de0452c0f7624b1da134`  
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
- [x] CI run **#83** passed the quote-acceptance guard migration, the one-winner regression test, request-status transition tests, existing RLS checks, lint, and the Next.js production build.
- [x] CI run **#78** passed the request-status guard migration and regression test, along with lint, production build, and existing database authorization checks.
- [x] Added migration `0003_quote_acceptance_guard.sql` to serialize offer acceptance, require the parent request to remain open, and prevent a second accepted offer; verified in CI run #83.
- [x] Implemented a public discovery API and homepage integration for active services from published providers, with active categories, service-title/description search, city/province filters, no-store responses, and a 48-listing cap. CI run #94 verified the lint/build and database regression checks, including exclusion of an active service from an unpublished provider.
- [x] Improved discovery relation mapping to tolerate both object and array shapes returned by Supabase joins.
- [x] Added optional provider starting prices in PHP and pricing notes to service creation and dashboard listing views.
- [x] Added provider-owned pause/reactivate controls for service listings; the server action scopes updates to the signed-in provider and service ID.
- [x] CI run **#104** passed lint, production build, migration/RLS checks, and existing customer/provider authorization and request-transition tests for the discovery and provider dashboard changes.

Verified run #74: https://github.com/aarondangenaldperez-ux/nearneed/actions/runs/41288976287  
Verified request-status guard run #78: https://github.com/aarondangenaldperez-ux/nearneed/actions/runs/41291369075  
Verified quote-acceptance guard run #83: https://github.com/aarondangenaldperez-ux/nearneed/actions/runs/41292133282

## 2. Implemented but awaiting verification

- [ ] Test the public discovery endpoint against a real configured Supabase project and exercise it in a real browser; disposable PostgreSQL CI does not prove the full Supabase PostgREST relationship response.
- [ ] Supabase SSR session and database integration against a real configured Supabase project.
- [ ] Registration, confirmation, sign-in, sign-out, invite gate, and recovery flows using real email delivery.
- [x] RLS behaviour under separate simulated customer/provider identities is checked against disposable PostgreSQL.
- [ ] Repeat authorization tests using real Supabase Auth sessions; CI Auth is a lightweight stub, not the full Supabase platform.
- [ ] End-to-end customer/provider journeys in a real browser.
- [ ] Production hosting, headers, environment configuration, backups, and monitoring.

## 3. Next engineering priorities

1. Test the public discovery endpoint against a real configured Supabase project and exercise it in a real browser.
2. Add a selected-service request handoff into the authenticated customer request flow; clearly state that the request goes to eligible providers, not as a direct message to the selected provider.
3. Add safe report submission UI and restricted moderation before live user-generated content.
4. Add rate limits and anti-spam controls to account creation, requests, and offers.
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

The homepage now has a Supabase-backed public discovery path, with a clearly labelled sample-category fallback when Supabase is not configured. Discovery relation mapping, provider pricing fields, and provider-owned listing pause/reactivate actions are included in the current main branch. CI run #104 passed lint, production build, migration, and RLS checks, but the app has not been tested against a real Supabase project. The homepage request preview is still local-only and does not save or send content. Dashboard workflows require a configured Supabase project. There is no direct messaging, notification, review, admin, payment, or deployment system.

A green CI run proves only the checks that actually ran. It does not prove a live production marketplace, real Supabase integration, or end-to-end browser correctness.
