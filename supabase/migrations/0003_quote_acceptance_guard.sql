-- Serialize quote acceptance against the parent request so only one offer can win.
-- The row lock also protects against concurrent accept operations.
begin;

create or replace function public.guard_quote_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_request_status public.request_status;
begin
  if new.status = 'accepted' and old.status = 'sent' then
    select nr.status
      into current_request_status
      from public.need_requests nr
      where nr.id = new.request_id
      for update;

    if current_request_status is distinct from 'open'::public.request_status then
      raise exception 'This request is no longer open for offer acceptance'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- This function is only intended to run as a table trigger, never as an API RPC.
revoke all on function public.guard_quote_acceptance() from public, anon, authenticated;

drop trigger if exists quotes_guard_acceptance on public.quotes;
create trigger quotes_guard_acceptance
  before update of status on public.quotes
  for each row
  when (new.status = 'accepted' and old.status = 'sent')
  execute function public.guard_quote_acceptance();

-- A customer may decide an offer only while its parent request is still open.
drop policy if exists "customer can decide on own request quote" on public.quotes;
create policy "customer can decide on own request quote"
  on public.quotes for update to authenticated
  using (
    status = 'sent'
    and exists (
      select 1 from public.need_requests nr
      where nr.id = request_id
        and nr.customer_id = (select auth.uid())
        and nr.status = 'open'
    )
  )
  with check (
    status in ('accepted', 'declined')
    and exists (
      select 1 from public.need_requests nr
      where nr.id = request_id
        and nr.customer_id = (select auth.uid())
        and nr.status = 'open'
    )
  );

commit;
