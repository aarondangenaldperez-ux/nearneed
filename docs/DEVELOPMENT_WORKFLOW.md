# NearNeed development workflow

**Last reviewed:** 1 November 2026  
**Default branch:** `main`

## The agreed operating model

NearNeed development uses three separate systems with distinct jobs:

1. **This ChatGPT project:** product decisions, code review, requirements, research, and task-by-task coordination.
2. **The connected GitHub tools:** read repository files, create/update commits, create branches, and open pull requests where permissions allow. Changes written here are saved in GitHub immediately as commits.
3. **GitHub Actions:** the remote execution environment. Each push to `main` and each pull request runs dependency installation, ESLint, a Next.js production build, and a disposable PostgreSQL migration/RLS check.

The repository is the durable source of truth. A chat transcript is not a source-control system.

## What happens when ChatGPT is closed

- Committed code, documentation, and history remain in GitHub.
- A GitHub Actions run already triggered by a push/PR continues independently of this chat and records its result in the repository's Actions tab.
- No new product development, coding, research, or bug fixing is happening in this conversation after it has ended. Do not expect an unfinished chat task to keep coding in the background.
- To resume, inspect the current default-branch head and its project status file first. Do not assume old chat context is more current than GitHub.

## Verified capabilities and current limits

| Capability | Result |
|---|---|
| Read the NearNeed repository | Verified |
| Write and commit files through the connected GitHub tools | Verified |
| Repository push/admin permission | Verified at last inspection |
| GitHub Actions remote execution | Verified; lint and production build passed on commit `ec093c252d6e7890e1734c45c8de67058f036637` |
| PostgreSQL execution in GitHub Actions | Verified; disposable Postgres 16 applied the migration and all schema/RLS/trigger assertions passed |
| Local clone from this ChatGPT runtime | Not available in the current session; a direct clone attempt failed because this runtime could not resolve `github.com` |
| Local browser/device testing from this ChatGPT runtime | Not available |
| Supabase project access | Not connected or verified |
| Deployment provider access | Not connected or verified |

## ChatGPT Work and Codex choice

The current account context is Free. OpenAI's current Help Center says:

- ChatGPT Work on web/mobile is for eligible paid plans; it is not included on Free or Go.
- Codex is included across plans, including Free, but Codex Cloud is not included on Free or Go.
- A local Codex desktop/CLI/IDE workflow requires a compatible computer and local development environment. It is not a prerequisite for our current GitHub Actions workflow.

Therefore, the practical workflow available to this project right now is **connected GitHub writes + GitHub Actions**, not ChatGPT Work or Codex Cloud. Do not upgrade solely to make the current repository workflow function.

## Required cycle for every substantial change

1. Read the current branch/head, relevant files, recent commits, and latest CI run.
2. Identify the scope and acceptance criteria before editing.
3. For risky or multi-file changes, create a feature branch. Keep the change focused.
4. Implement and commit the actual files. Never claim changes are saved until GitHub returns a commit SHA.
5. Wait for the GitHub Actions result within the active task, or leave the run pending and clearly report that it has not been checked yet. Do not ask the user to wait in the chat for hours.
6. Inspect the exact run for the exact commit. A successful lint/build does not prove database, authorization, browser, payment, or production behaviour.
7. Fix failures, rerun CI, and update `docs/PROJECT_STATUS.md`.
8. Merge only after appropriate review and successful checks.

## CI gates

The CI workflow should fail when any of these are broken:

- Dependency install.
- ESLint.
- Next.js production build.
- Supabase schema migration on an ephemeral PostgreSQL instance.
- Expected RLS policy count and critical database triggers.

The PostgreSQL job uses a small local Auth schema stub solely to validate migration syntax and database objects. Run 61 passed. It does **not** emulate the complete Supabase platform and does not replace live RLS tests using distinct user identities.

## Safety and credential handling

- Never ask for or commit a service-role key, password, database password, private user record, government ID, or personal contact list.
- Public Supabase URL and publishable key are environment variables; the service-role key is server-only and must never use a `NEXT_PUBLIC_` variable.
- Leave the invite gate closed until an adult project owner has reviewed privacy, legal, trust/safety, moderation, and support requirements.
- The repository is currently public. Change its GitHub visibility to Private before placing confidential business information or non-public code/data in it. This ChatGPT GitHub connection does not currently expose a repository-visibility update action.
- Do not connect a real payment provider or collect customer/provider personal data until an adult project owner and qualified reviewer have handled applicable legal, privacy, and financial requirements.

## Resume prompt

When a new development session begins, use this order:

1. Read `docs/PROJECT_STATUS.md` and this file.
2. Fetch the repository default branch and latest commit.
3. Check the Actions run associated with that exact commit.
4. Read only the source files relevant to the next incomplete priority.
5. Continue from the saved branch and commit history. Do not rebuild or restart the project unnecessarily.
