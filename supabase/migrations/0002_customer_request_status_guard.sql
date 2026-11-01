-- Restrict customer-controlled request status changes to cancellation.
-- A customer must not be able to self-assign "matched" or "completed", nor reopen a cancelled request.
begin;

drop policy if exists "customer can update own request" on public.need_requests;
create policy "customer can cancel own open request"
  on public.need_requests for update to authenticated
  using (
    customer_id = (select auth.uid())
    and status = 'open'
  )
  with check (
    customer_id = (select auth.uid())
    and status = 'cancelled'
  );

commit;
