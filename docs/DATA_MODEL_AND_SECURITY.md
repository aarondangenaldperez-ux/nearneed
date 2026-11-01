# NearNeed data model and security boundaries

## Design rules

1. A user identity comes from Supabase Auth; application tables reference `auth.users` through an internal profile row.
2. Customer identity details are private by default.
3. Public provider details live in a separate provider profile and are published deliberately.
4. Requests use city/municipality and province only. Do not store exact home addresses or public GPS coordinates in the pilot schema.
5. An offer belongs to exactly one request and one provider.
6. Reports are private to the reporter and authorized moderators.
7. Every exposed table has Row Level Security enabled and explicit grants.
8. A service-role key is server-only and must never be shipped to the browser.

## Tables in the starter migration

| Table | Purpose | Public access |
|---|---|---|
| `profiles` | Private application profile tied to Auth | Owner only |
| `provider_profiles` | Deliberately published provider information | Published profiles only |
| `service_categories` | Controlled service taxonomy | Active categories |
| `provider_services` | Published service descriptions and approximate price information | Active services of published providers |
| `need_requests` | Customer requests and area | Owner and eligible signed-in providers whose active service area/category matches |
| `quotes` | Provider offers on requests | Request owner and quote's provider |
| `reports` | User/content safety reports | Reporter and authorized admin process |

## Permission summary

| Action | Customer | Published provider | Anonymous |
|---|---:|---:|---:|
| Read active categories | Yes | Yes | Yes |
| Read own private profile | Yes | Yes | No |
| Read published provider profiles/services | Yes | Yes | Yes |
| Create provider service | No | Yes | No |
| Create request | Yes | No | No |
| Read own request | Yes | Yes, if open and an active service matches the city, province, and category | No |
| Create offer | No | Yes | No |
| Read own offer | No | Yes | No |
| Read offers on own request | Yes | No | No |
| Submit report | Yes | Yes | No |
| Read all reports | No | No | No |

The migration uses database policies as the security boundary. The table is a summary; the SQL is authoritative.

## Important limitations

- This is a first migration, not a complete production security system.
- Admin moderation needs a separate restricted process and audit trail.
- The schema does not yet include messaging, notifications, payments, reviews, identity-document storage, or automated verification.
- The migration should be tested in a disposable Supabase project before any real data is collected.
- Add automated RLS tests for every role, including cross-user access attempts, before launch.
- Check the current Supabase documentation before applying major platform or auth changes.

## Apply and test

1. Create a Supabase project owned by the responsible adult/project owner.
2. Keep the project URL and browser-safe anon/publishable key in environment variables; never expose the service-role key.
3. Review the SQL migration.
4. Apply it to a new project through the Supabase SQL editor or migration tooling.
5. Create separate customer and provider test accounts.
6. Test every row-level permission in the matrix, including negative tests.
7. Only then connect application pages to the database.

Supabase's documentation stresses that table grants and RLS policies work together, and that exposed tables should have RLS enabled. See [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Supabase Auth](https://supabase.com/docs/guides/auth).

## Privacy work required before public launch

Prepare a privacy notice before collecting personal data. It must accurately state what information is collected, why it is processed, who can receive it, retention, controller contact details, and data-subject rights. Do not copy a generic policy without checking the actual implementation. See the [Philippine National Privacy Commission's guidance](https://privacy.gov.ph/the-right-to-be-informed/).
