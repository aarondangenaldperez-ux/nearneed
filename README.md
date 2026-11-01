# NearNeed

**Find help. Offer help. Get things done.**

NearNeed is a Philippine-focused local discovery and service marketplace concept. It is designed to help people describe what they need and connect with nearby independent providers and small businesses.

## Current status

Early MVP foundation. This repository currently contains a responsive, interactive frontend prototype. It is not yet a production marketplace: authentication, database persistence, messaging, payments, provider verification, moderation, and location-aware search still need to be implemented and tested.

## Product principles

- Start with a useful, focused customer-to-provider matching experience.
- Make local discovery work for Philippine cities and communities.
- Show clear provider information and transparent PHP pricing.
- Protect users through privacy-conscious defaults, reporting, and moderation.
- Validate demand before adding complex features or monetization.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Planned milestones

1. Validate the core NeedBoard workflow with real users.
2. Add Supabase authentication and PostgreSQL data model.
3. Add location-aware discovery and provider profiles.
4. Add quote responses, in-app messaging, and reporting.
5. Add provider tools and carefully tested monetization.
6. Prepare production deployment, monitoring, backups, and security review.

## Important

Do not commit API keys, passwords, service-role keys, private customer data, or other secrets. Use environment variables and an untracked `.env.local` file.
