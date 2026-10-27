-- Smarter Web Push (app/api/cron/push, app/api/cron/budget-alerts):
-- * each reminder knows its kind, so the 20:00 nudge is skipped once
--   something was recorded that day, from any device;
-- * budget alerts (80% and 100% of a category) are sent from the server when
--   an expense is saved, once per level and budget month.

alter table saku.push_schedule
  add column kind text not null default 'other' check (kind in ('bill', 'daily', 'report', 'other'));

-- Whether this browser wants budget alerts (Pengaturan > Notifikasi).
alter table saku.push_subscriptions add column budget_alerts boolean not null default true;

create table saku.push_budget_alerts (
  user_id uuid not null references saku.profiles(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  category_id uuid not null references saku.categories(id) on delete cascade,
  level integer not null check (level in (80, 100)),
  sent_at timestamptz not null default now(),
  primary key (user_id, month, category_id)
);

alter table saku.push_budget_alerts enable row level security;
create policy "Budget alerts are the user's own" on saku.push_budget_alerts
  for select using (user_id = auth.uid());

-- After expenses are saved, ask the app to check the budgets of their owners
-- who have a browser that wants budget alerts. One call per statement, so a
-- batch of imported transactions is one check.
create function saku.request_budget_alerts() returns trigger
  language plpgsql
  security definer
  set search_path to 'saku'
  as $$
declare
  app_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'saku_app_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'saku_cron_secret');
  owners uuid[];
begin
  if app_url is null or secret is null then return null; end if;
  select array_agg(distinct c.user_id) into owners
    from changed c
   where c.type = 'expense'
     and exists (select 1 from saku.push_subscriptions s where s.user_id = c.user_id and s.budget_alerts);
  if owners is null then return null; end if;
  -- Saving the expense matters more than the alert: never fail it over this.
  begin
    perform net.http_post(
      url := app_url || '/api/cron/budget-alerts',
      headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
      body := jsonb_build_object('userIds', to_jsonb(owners))
    );
  exception when others then
    raise warning 'budget alert request failed: %', sqlerrm;
  end;
  return null;
end;
$$;

revoke execute on function saku.request_budget_alerts() from public, anon, authenticated;

-- Transition tables allow one event per trigger, hence two.
create trigger transactions_budget_alerts_insert
  after insert on saku.transactions
  referencing new table as changed
  for each statement execute function saku.request_budget_alerts();

create trigger transactions_budget_alerts_update
  after update on saku.transactions
  referencing new table as changed
  for each statement execute function saku.request_budget_alerts();
