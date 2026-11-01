# NearNeed pilot MVP requirements

**Version:** 0.1  
**Status:** Product specification for the first controlled pilot

## Product goal

Validate one outcome: a customer describes a real service need, relevant local providers can discover it, providers send useful offers, and the customer can compare and choose an offer.

The first release is a controlled pilot, not a nationwide marketplace.

## Primary roles

- **Visitor:** reads the product explanation and service categories.
- **Customer:** creates and manages a request, compares offers, accepts or declines an offer, and reports concerns.
- **Provider:** creates a public service profile, publishes service areas, sees eligible open requests, and sends or withdraws an offer.
- **Moderator:** reviews reports and can hide content or suspend accounts using a restricted administrative process.

Initial live pilot participation should be limited to adults (18+) unless an appropriate, professionally reviewed guardian-consent process is established. The public prototype must not solicit contact details from children.

## Core user journeys

### Customer

1. Create an account and confirm the account email.
2. Create a request with a title, description, category, city/municipality, province, and optional budget range.
3. Review a preview before publishing.
4. See the request status and incoming offers.
5. Compare each offer's price or pricing note, provider profile, scope, and estimated turnaround.
6. Accept one offer or close the request.
7. Report an account, request, or offer when needed.

### Provider

1. Create an account and a provider profile.
2. Add a short public profile and service area.
3. Publish at least one service category and description.
4. Browse open requests relevant to the provider's chosen service area and categories.
5. Submit one offer per request with a message and optional amount / pricing explanation.
6. Withdraw an offer if it is no longer available.
7. Report suspicious requests or accounts.

### Moderator

1. Review reports in a restricted admin interface or controlled database workflow.
2. Record the decision and reason.
3. Hide harmful or misleading content and suspend accounts when justified.
4. Keep an auditable record of moderation actions.

The moderator interface is not part of the current frontend prototype. Do not launch live user-generated content until this process exists.

## MVP scope

### Must have before a public pilot

- Authentication and email confirmation.
- Customer and provider profiles with role permissions.
- Provider profile publication controls.
- Controlled list of service categories.
- Request creation, preview, editing, cancellation, and status.
- Provider request feed, limited to eligible published providers.
- Provider offers / quotes and customer accept / decline.
- Row Level Security (RLS) on every exposed database table.
- Report submission and a working moderation process.
- Privacy notice, terms, community rules, support contact, retention policy.
- Rate limiting / anti-spam controls for sign-up, requests, and offers.
- Responsive, keyboard-accessible interface.
- Error, loading, empty, and success states.
- Backups, monitoring, and a documented incident process.

### Defer until the pilot proves demand

- Online payments, escrow, and automatic commissions.
- Real-time chat; begin with structured offers and a moderated contact workflow.
- Live GPS, route tracking, and precise location collection.
- AI-generated matching or ranking.
- Nationwide map search.
- Public reviews until there is a reliable completed-job signal.
- Paid boosts, ads, subscriptions, and complex provider analytics.
- Native mobile apps.

## Functional acceptance criteria

### Requests

- A signed-in customer can create a request with a valid title, description, category, and city/municipality.
- The form clearly states not to include exact street addresses, phone numbers, government IDs, or payment details.
- Public visitors cannot read private request data.
- Only the request owner can edit or close a request.
- Published providers can read only open requests matching an active service's city, province, and category (or an uncategorized request) in the pilot rules.
- A request cannot be submitted twice by an accidental double click.

### Offers

- A published provider can submit at most one active offer per request.
- Providers cannot submit an offer to their own request.
- Customers can read only offers attached to their own requests.
- Providers can read only their own offers and the relevant request.
- A customer can accept at most one offer per request. Acceptance changes the request to matched and closes other outstanding offers.
- An accepted offer cannot be silently changed by the provider.

### Provider profiles

- Public profiles show only deliberately published fields.
- Exact home addresses, personal phone numbers, private email addresses, and identity documents are never public.
- A trust badge is not self-assignable.
- "Verified" is used only when an actual defined review process has been performed.

### Reporting and moderation

- A signed-in user can report a user or piece of content.
- Reports are visible only to the reporter and authorized moderators.
- Users cannot edit or delete a report after submission.
- Moderation actions are logged.
- The app explains how to get help and what content is prohibited.

## Non-functional requirements

- Mobile-first layout and clear focus indicators.
- Useful error messages that do not leak internal details.
- Server-side validation for all writes; client validation is only a convenience.
- RLS and least-privilege database grants; never rely on UI hiding to enforce permissions.
- No service-role key in browser code.
- No unnecessary third-party trackers during the pilot.
- No public request indexing by search engines until content moderation and privacy controls are established.
- Dependency versions kept on supported, security-patched releases.
- Automated lint and production-build checks run on pushes and pull requests.

## Not a launch-ready marketplace yet

The current repository is a frontend prototype. This specification does not mean any of these capabilities have been implemented. The database migration is a starter schema; it must be applied to a newly configured Supabase project, tested against real roles, connected to the app, and reviewed before real people use it.
