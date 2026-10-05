-- Close privilege-escalation paths around plans, payments and AI quotas.

-- New users start on FREE; PRO is granted only after a verified payment.
alter table public.profiles alter column plan set default 'FREE';

-- Users may still update their own profile (name, currency, onboarding),
-- but plan, AI and live-price quota columns can only be changed by the
-- service role (server-side code using SUPABASE_SERVICE_ROLE_KEY).
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.plan := 'FREE';
      new.ai_unlimited := false;
      new.live_price_used_at := null;
    else
      new.plan := old.plan;
      new.ai_unlimited := old.ai_unlimited;
      new.live_price_used_at := old.live_price_used_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- Payments were readable by every signed-in user. Owners may read their own
-- rows; all writes go through the service role.
alter table public.payments enable row level security;
drop policy if exists "Payments are readable by owner" on public.payments;
create policy "Payments are readable by owner" on public.payments
  for select using (user_id = auth.uid());

-- AI usage logs: owners may read and append, but not delete (which would
-- reset their quota).
drop policy if exists "AI logs are accessible by owner" on public.ai_logs;
drop policy if exists "AI logs are readable by owner" on public.ai_logs;
drop policy if exists "AI logs are insertable by owner" on public.ai_logs;
create policy "AI logs are readable by owner" on public.ai_logs
  for select using ((auth.jwt()->>'email') = email);
create policy "AI logs are insertable by owner" on public.ai_logs
  for insert with check ((auth.jwt()->>'email') = email);
