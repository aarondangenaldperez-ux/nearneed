-- NearNeed starter schema
-- Apply only to a NEW Supabase project after review.
-- This is not a production security certification.
begin;

do $$ begin
  create type public.profile_role as enum ('customer', 'provider', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_mode as enum ('online', 'in_person', 'hybrid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('open', 'matched', 'paused', 'completed', 'cancelled');
exception when duplicate_object then null; end $;

alter type public.request_status add value if not exists 'matched' after 'open';

do $ begin
  create type public.quote_status as enum ('sent', 'accepted', 'declined', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_reason as enum ('spam', 'misrepresentation', 'harassment', 'unsafe_activity', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  role public.profile_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  public_name text not null check (char_length(btrim(public_name)) between 2 and 60),
  business_name text check (business_name is null or char_length(business_name) <= 100),
  about text check (about is null or char_length(about) <= 700),
  city text not null check (char_length(btrim(city)) between 2 and 100),
  province text not null check (char_length(btrim(province)) between 2 and 100),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 4 and 100),
  description text not null check (char_length(btrim(description)) between 20 and 1200),
  service_mode public.service_mode not null default 'in_person',
  price_from numeric(12,2) check (price_from is null or price_from >= 0),
  pricing_note text check (pricing_note is null or char_length(pricing_note) <= 120),
  city text not null check (char_length(btrim(city)) between 2 and 100),
  province text not null check (char_length(btrim(province)) between 2 and 100),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.need_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 8 and 120),
  description text not null check (char_length(btrim(description)) between 20 and 2000),
  city text not null check (char_length(btrim(city)) between 2 and 100),
  province text not null check (char_length(btrim(province)) between 2 and 100),
  budget_min numeric(12,2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(12,2) check (budget_max is null or budget_max >= 0),
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_budget_range check (
    budget_min is null or budget_max is null or budget_min <= budget_max
  )
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.need_requests(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 20 and 1500),
  price_amount numeric(12,2) check (price_amount is null or price_amount >= 0),
  pricing_note text check (pricing_note is null or char_length(pricing_note) <= 200),
  estimated_days integer check (estimated_days is null or estimated_days between 0 and 365),
  status public.quote_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_quote_per_provider_per_request unique (request_id, provider_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  request_id uuid references public.need_requests(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 1500),
  created_at timestamptz not null default now(),
  constraint report_has_target check (
    reported_user_id is not null or request_id is not null or quote_id is not null
  )
);

create index if not exists provider_services_area_idx
  on public.provider_services (province, city, category_id)
  where is_active = true;

create index if not exists need_requests_feed_idx
  on public.need_requests (province, city, category_id, created_at desc)
  where status = 'open';

create index if not exists quotes_request_idx
  on public.quotes (request_id, created_at desc);

create unique index if not exists one_accepted_quote_per_request
  on public.quotes (request_id)
  where status = 'accepted';

-- Keep updated_at consistent for records that expose it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
  if requested_name is null or char_length(requested_name) < 2 or char_length(requested_name) > 60 then
    requested_name := 'New member';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, requested_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists provider_profiles_set_updated_at on public.provider_profiles;
create trigger provider_profiles_set_updated_at before update on public.provider_profiles
for each row execute function public.set_updated_at();

drop trigger if exists provider_services_set_updated_at on public.provider_services;
create trigger provider_services_set_updated_at before update on public.provider_services
for each row execute function public.set_updated_at();

drop trigger if exists need_requests_set_updated_at on public.need_requests;
create trigger need_requests_set_updated_at before update on public.need_requests
for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
for each row execute function public.set_updated_at();

-- Once a customer accepts an offer, stop the request from receiving new offers
-- and close every other outstanding offer for that request.
create or replace function public.close_request_after_quote_accept()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  if new.status = 'accepted' and old.status = 'sent' then
    update public.need_requests
      set status = 'matched'
      where id = new.request_id and status = 'open';

    update public.quotes
      set status = 'declined'
      where request_id = new.request_id
        and id <> new.id
        and status = 'sent';
  end if;

  return new;
end;
$;

drop trigger if exists quotes_close_request_after_accept on public.quotes;
create trigger quotes_close_request_after_accept
  after update of status on public.quotes
  for each row
  when (new.status = 'accepted' and old.status = 'sent')
  execute function public.close_request_after_quote_accept();

-- Example categories only. The final pilot categories should be chosen from interviews.
insert into public.service_categories (slug, name, description)
values
  ('home-services', 'Home services', 'Everyday maintenance and household support.'),
  ('tech-help', 'Tech help', 'Device setup, software help, and non-hazardous technical support.'),
  ('learning', 'Learning', 'Lessons, tutoring, and skill development.'),
  ('creative', 'Creative', 'Design, photography, video, and creative projects.'),
  ('events', 'Events', 'Event planning and event-related services.')
on conflict (slug) do nothing;

-- Enable RLS on every application table.
alter table public.profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.provider_services enable row level security;
alter table public.need_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.reports enable row level security;

-- Remove broad defaults before granting only the operations needed.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.provider_profiles from anon, authenticated;
revoke all on table public.service_categories from anon, authenticated;
revoke all on table public.provider_services from anon, authenticated;
revoke all on table public.need_requests from anon, authenticated;
revoke all on table public.quotes from anon, authenticated;
revoke all on table public.reports from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select on table public.provider_profiles to anon, authenticated;
grant insert, update, delete on table public.provider_profiles to authenticated;
grant select on table public.service_categories to anon, authenticated;
grant select on table public.provider_services to anon, authenticated;
grant insert, update, delete on table public.provider_services to authenticated;
grant select, insert, update on table public.need_requests to authenticated;
grant select, insert on table public.quotes to authenticated;
grant update (status) on table public.quotes to authenticated;
grant select, insert on table public.reports to authenticated;

-- Profiles are private: users can only read and update their own row.
drop policy if exists "profile owner can read" on public.profiles;
create policy "profile owner can read"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profile owner can update" on public.profiles;
create policy "profile owner can update"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Public provider information is visible only when deliberately published.
drop policy if exists "published provider profiles are readable" on public.provider_profiles;
create policy "published provider profiles are readable"
  on public.provider_profiles for select to anon, authenticated
  using (is_published = true or user_id = (select auth.uid()));

drop policy if exists "provider owner can create profile" on public.provider_profiles;
create policy "provider owner can create profile"
  on public.provider_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "provider owner can update profile" on public.provider_profiles;
create policy "provider owner can update profile"
  on public.provider_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "active categories are readable" on public.service_categories;
create policy "active categories are readable"
  on public.service_categories for select to anon, authenticated
  using (is_active = true);

-- Public service listings show only active services from published providers.
drop policy if exists "active services are readable" on public.provider_services;
create policy "active services are readable"
  on public.provider_services for select to anon, authenticated
  using (
    (is_active = true and exists (
      select 1 from public.provider_profiles pp
      where pp.user_id = provider_id and pp.is_published = true
    ))
    or provider_id = (select auth.uid())
  );

drop policy if exists "provider owner can create service" on public.provider_services;
create policy "provider owner can create service"
  on public.provider_services for insert to authenticated
  with check (
    provider_id = (select auth.uid())
    and exists (select 1 from public.provider_profiles pp where pp.user_id = (select auth.uid()))
  );

drop policy if exists "provider owner can update service" on public.provider_services;
create policy "provider owner can update service"
  on public.provider_services for update to authenticated
  using (provider_id = (select auth.uid()))
  with check (provider_id = (select auth.uid()));

drop policy if exists "provider owner can delete service" on public.provider_services;
create policy "provider owner can delete service"
  on public.provider_services for delete to authenticated
  using (provider_id = (select auth.uid()));

-- Only the owner and eligible providers may read open requests.
drop policy if exists "customer and published providers can read requests" on public.need_requests;
create policy "customer and published providers can read requests"
  on public.need_requests for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (
      status = 'open'
      and exists (
        select 1
        from public.provider_profiles pp
        where pp.user_id = (select auth.uid())
          and pp.is_published = true
          and exists (
            select 1
            from public.provider_services ps
            where ps.provider_id = pp.user_id
              and ps.is_active = true
              and lower(ps.city) = lower(need_requests.city)
              and lower(ps.province) = lower(need_requests.province)
              and (
                need_requests.category_id is null
                or ps.category_id = need_requests.category_id
              )
          )
      )
    )
  );

drop policy if exists "customer can create own request" on public.need_requests;
create policy "customer can create own request"
  on public.need_requests for insert to authenticated
  with check (customer_id = (select auth.uid()));

drop policy if exists "customer can update own request" on public.need_requests;
create policy "customer can update own request"
  on public.need_requests for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

-- Offers are visible only to their provider and the customer who owns the request.
drop policy if exists "request owner and provider can read quotes" on public.quotes;
create policy "request owner and provider can read quotes"
  on public.quotes for select to authenticated
  using (
    provider_id = (select auth.uid())
    or exists (
      select 1 from public.need_requests nr
      where nr.id = request_id and nr.customer_id = (select auth.uid())
    )
  );

drop policy if exists "published provider can create quote" on public.quotes;
create policy "published provider can create quote"
  on public.quotes for insert to authenticated
  with check (
    provider_id = (select auth.uid())
    and exists (
      select 1 from public.provider_profiles pp
      where pp.user_id = (select auth.uid()) and pp.is_published = true
    )
    and exists (
      select 1 from public.need_requests nr
      where nr.id = request_id and nr.status = 'open' and nr.customer_id <> (select auth.uid())
    )
  );

drop policy if exists "provider can withdraw own quote" on public.quotes;
create policy "provider can withdraw own quote"
  on public.quotes for update to authenticated
  using (provider_id = (select auth.uid()) and status = 'sent')
  with check (provider_id = (select auth.uid()) and status = 'withdrawn');

drop policy if exists "customer can decide on own request quote" on public.quotes;
create policy "customer can decide on own request quote"
  on public.quotes for update to authenticated
  using (
    status = 'sent'
    and exists (
      select 1 from public.need_requests nr
      where nr.id = request_id and nr.customer_id = (select auth.uid())
    )
  )
  with check (
    status in ('accepted', 'declined')
    and exists (
      select 1 from public.need_requests nr
      where nr.id = request_id and nr.customer_id = (select auth.uid())
    )
  );

-- A report is private and immutable to the reporter after submission.
drop policy if exists "users can submit reports about themselves" on public.reports;
create policy "users can submit reports"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (reported_user_id is null or reported_user_id <> (select auth.uid()))
  );

drop policy if exists "reporter can read own reports" on public.reports;
create policy "reporter can read own reports"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()));

commit;
