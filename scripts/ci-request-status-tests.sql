-- Verify customers can cancel their own open request, but cannot forge
-- a match/completion state or reopen a cancelled request.
begin;

insert into auth.users (id, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000011', '{"display_name":"Status Test Customer"}');

insert into public.need_requests
  (id, customer_id, title, description, city, province, status)
values
  ('00000000-0000-0000-0000-000000000111',
   '00000000-0000-0000-0000-000000000011',
   'Request status transition test',
   'A test request used to verify customer status transition permissions.',
   'Quezon City', 'Metro Manila', 'open');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);

do $$
declare
  changed_rows integer;
  final_status text;
begin
  begin
    update public.need_requests
      set status = 'matched'
      where id = '00000000-0000-0000-0000-000000000111';
    raise exception 'RLS failure: customer forged a matched request';
  exception
    when insufficient_privilege then null;
  end;

  update public.need_requests
    set status = 'cancelled'
    where id = '00000000-0000-0000-0000-000000000111';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'Customer should be able to cancel their own open request';
  end if;

  update public.need_requests
    set status = 'open'
    where id = '00000000-0000-0000-0000-000000000111';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'RLS failure: customer reopened a cancelled request';
  end if;

  select status::text into final_status
    from public.need_requests
    where id = '00000000-0000-0000-0000-000000000111';
  if final_status <> 'cancelled' then
    raise exception 'Expected cancelled status to remain immutable; got %', final_status;
  end if;
end
$$;

reset role;
rollback;
