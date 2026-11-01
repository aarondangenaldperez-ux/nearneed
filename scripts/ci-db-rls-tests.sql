-- Behaviour-level RLS tests for the NearNeed database policies.
-- Runs only against the disposable PostgreSQL service in GitHub Actions.
-- The Auth schema and auth.uid() are lightweight CI stubs, not full Supabase.
begin;

-- Identities are isolated by the auth.uid() claim, as Supabase policies expect.
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', '{"display_name":"Customer A"}'),
  ('00000000-0000-0000-0000-000000000002', '{"display_name":"Provider A"}'),
  ('00000000-0000-0000-0000-000000000003', '{"display_name":"Provider B"}'),
  ('00000000-0000-0000-0000-000000000004', '{"display_name":"Customer B"}');

insert into public.provider_profiles
  (user_id, public_name, about, city, province, is_published)
values
  ('00000000-0000-0000-0000-000000000002', 'Provider A', 'Provides local technology help and support.', 'Quezon City', 'Metro Manila', true),
  ('00000000-0000-0000-0000-000000000003', 'Provider B', 'Provides local household cleaning services.', 'Davao City', 'Davao del Sur', true);

insert into public.provider_services
  (provider_id, category_id, title, description, city, province, is_active)
values
  ('00000000-0000-0000-0000-000000000002',
   (select id from public.service_categories where slug = 'tech-help'),
   'Computer setup and support', 'Setup, troubleshooting, and everyday computer support.', 'Quezon City', 'Metro Manila', true),
  ('00000000-0000-0000-0000-000000000003',
   (select id from public.service_categories where slug = 'home-services'),
   'Home cleaning service', 'Regular household cleaning and basic organization.', 'Davao City', 'Davao del Sur', true);

insert into public.need_requests
  (id, customer_id, category_id, title, description, city, province, status, budget_min, budget_max)
values
  ('00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000004',
   (select id from public.service_categories where slug = 'tech-help'),
   'Computer setup request', 'Help setting up a home computer and basic software.', 'Quezon City', 'Metro Manila', 'open', 500, 2500),
  ('00000000-0000-0000-0000-000000000102',
   '00000000-0000-0000-0000-000000000004',
   (select id from public.service_categories where slug = 'home-services'),
   'House cleaning request', 'Looking for a household cleaning service this week.', 'Quezon City', 'Metro Manila', 'open', 500, 1500),
  ('00000000-0000-0000-0000-000000000103',
   '00000000-0000-0000-0000-000000000004',
   (select id from public.service_categories where slug = 'tech-help'),
   'Davao computer support', 'Need help setting up a laptop and common applications.', 'Davao City', 'Davao del Sur', 'open', 500, 2000),
  ('00000000-0000-0000-0000-000000000104',
   '00000000-0000-0000-0000-000000000004',
   (select id from public.service_categories where slug = 'tech-help'),
   'Another computer setup', 'Need help installing software and configuring a computer.', 'Quezon City', 'Metro Manila', 'open', 500, 2000),
  ('00000000-0000-0000-0000-000000000105',
   '00000000-0000-0000-0000-000000000001',
   (select id from public.service_categories where slug = 'tech-help'),
   'Private customer request', 'This request must only be visible to its customer.', 'Cebu City', 'Cebu', 'open', 500, 2000);

insert into public.quotes
  (id, request_id, provider_id, message, price_amount, status)
values
  ('00000000-0000-0000-0000-000000000201',
   '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000002',
   'I can provide the computer setup and software configuration.', 1200, 'sent'),
  -- Deliberately seeded as a second outstanding offer to test one-winner enforcement.
  ('00000000-0000-0000-0000-000000000202',
   '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000003',
   'I can also provide the computer setup and software configuration.', 1300, 'sent');

-- Anonymous visitors may read only published provider profiles and public services.
set role anon;
do $$
declare
  visible_profiles integer;
  visible_services integer;
begin
  select count(*) into visible_profiles from public.provider_profiles;
  select count(*) into visible_services from public.provider_services;
  if visible_profiles <> 2 then
    raise exception 'Anonymous users should see exactly 2 published provider profiles; saw %', visible_profiles;
  end if;
  if visible_services <> 2 then
    raise exception 'Anonymous users should see exactly 2 active services of published providers; saw %', visible_services;
  end if;
end
$$;
reset role;

-- Customer A can see only their own request and no offers on another customer's request.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $$
declare
  visible_requests integer;
  visible_quotes integer;
begin
  select count(*) into visible_requests from public.need_requests;
  select count(*) into visible_quotes from public.quotes;
  if visible_requests <> 1 then
    raise exception 'Customer A should see exactly 1 own request; saw %', visible_requests;
  end if;
  if visible_quotes <> 0 then
    raise exception 'Customer A must not see another customer quote; saw %', visible_quotes;
  end if;

  begin
    insert into public.need_requests
      (customer_id, title, description, city, province)
    values
      ('00000000-0000-0000-0000-000000000004',
       'Attempted cross-owner request', 'This insert must be rejected by row-level security.',
       'Quezon City', 'Metro Manila');
    raise exception 'RLS failure: Customer A inserted a request for Customer B';
  exception
    when insufficient_privilege then null;
  end;
end
$$;
reset role;

-- Customer B can see their own requests/offers and can decide on an offer.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', false);
do $$
declare
  visible_requests integer;
  visible_quotes integer;
  visible_reports integer;
  matched_status text;
begin
  select count(*) into visible_requests from public.need_requests;
  select count(*) into visible_quotes from public.quotes;
  if visible_requests <> 4 then
    raise exception 'Customer B should see exactly 4 own requests; saw %', visible_requests;
  end if;
  if visible_quotes <> 2 then
    raise exception 'Customer B should see both offers on their request; saw %', visible_quotes;
  end if;

  insert into public.reports (reporter_id, reported_user_id, reason, details)
  values ('00000000-0000-0000-0000-000000000004',
          '00000000-0000-0000-0000-000000000002',
          'spam', 'CI privacy test report');

  select count(*) into visible_reports from public.reports;
  if visible_reports <> 1 then
    raise exception 'Customer B should see their own report; saw %', visible_reports;
  end if;

  update public.quotes
    set status = 'accepted'
    where id = '00000000-0000-0000-0000-000000000201';

  select status::text into matched_status
    from public.need_requests
    where id = '00000000-0000-0000-0000-000000000101';

  if matched_status <> 'matched' then
    raise exception 'Accepting an offer must mark its request matched; got %', matched_status;
  end if;

  if (select status from public.quotes where id = '00000000-0000-0000-0000-000000000202') <> 'declined' then
    raise exception 'Accepting one offer must decline every other outstanding offer';
  end if;
end
$;
reset role;

-- Even a privileged writer must not be able to accept a stale offer after the request is matched.
update public.quotes
  set status = 'sent'
  where id = '00000000-0000-0000-0000-000000000202';
do $
begin
  begin
    update public.quotes
      set status = 'accepted'
      where id = '00000000-0000-0000-0000-000000000202';
    raise exception 'Guard failure: a second offer was accepted after the request was matched';
  exception
    when check_violation then null;
  end;
end
$;
update public.quotes
  set status = 'declined'
  where id = '00000000-0000-0000-0000-000000000202';

-- Provider A sees only open requests matching active service city, province and category.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
do $$
declare
  visible_requests integer;
  visible_quotes integer;
  changed_rows integer;
begin
  select count(*) into visible_requests from public.need_requests;
  select count(*) into visible_quotes from public.quotes;
  if visible_requests <> 1 then
    raise exception 'Provider A should see only the remaining matching open request; saw %', visible_requests;
  end if;
  if visible_quotes <> 1 then
    raise exception 'Provider A should see only their own accepted offer; saw %', visible_quotes;
  end if;

  insert into public.quotes (request_id, provider_id, message, price_amount)
  values ('00000000-0000-0000-0000-000000000104',
          '00000000-0000-0000-0000-000000000002',
          'I can complete the computer setup and software configuration.', 1400);

  update public.quotes
    set status = 'withdrawn'
    where id = '00000000-0000-0000-0000-000000000201';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'A provider must not withdraw an already accepted offer';
  end if;
end
$$;
reset role;

-- Provider B has an active but non-matching city/category and sees no requests.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', false);
do $$
declare
  visible_requests integer;
begin
  select count(*) into visible_requests from public.need_requests;
  if visible_requests <> 0 then
    raise exception 'Provider B must not see requests outside its service area/category; saw %', visible_requests;
  end if;

  begin
    insert into public.quotes (request_id, provider_id, message, price_amount)
    values ('00000000-0000-0000-0000-000000000104',
            '00000000-0000-0000-0000-000000000003',
            'This mismatched provider offer must be rejected.', 900);
    raise exception 'RLS failure: Provider B submitted an offer to a non-matching request';
  exception
    when insufficient_privilege then null;
  end;
end
$$;
reset role;

-- Customer A cannot see Customer B's private report.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
do $$
declare
  visible_reports integer;
begin
  select count(*) into visible_reports from public.reports;
  if visible_reports <> 0 then
    raise exception 'Customer A must not see Customer B reports; saw %', visible_reports;
  end if;
end
$$;
reset role;

rollback;
