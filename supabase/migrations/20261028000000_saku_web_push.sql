-- Web Push for the installed web app (PWA). The browser's push subscription is
-- stored per user; the home screen uploads the reminders it would schedule on
-- a phone (lib/notifications.ts planNotifications) and /api/cron/push sends
-- each one when it is due, to every subscription of that user.

create table saku.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://'),
  user_id uuid not null references saku.profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on saku.push_subscriptions (user_id);

create table saku.push_schedule (
  user_id uuid not null references saku.profiles(id) on delete cascade,
  -- planNotifications' id: the same event keeps the same row.
  id integer not null,
  title text not null check (char_length(title) <= 120),
  body text not null check (char_length(body) <= 300),
  url text not null check (url ~ '^/'),
  send_at timestamptz not null,
  primary key (user_id, id)
);

create index push_schedule_send_at_idx on saku.push_schedule (send_at);

alter table saku.push_subscriptions enable row level security;
alter table saku.push_schedule enable row level security;

create policy "Push subscriptions are the user's own" on saku.push_subscriptions
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Push schedule is the user's own" on saku.push_schedule
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Every 5 minutes, when something is due, ask the app to send it. The app's
-- address and the shared secret live in Vault (README.md, "Web Push");
-- without them nothing runs, so local databases never call production.
create extension if not exists pg_net;

create function saku.request_push_send() returns void
  language plpgsql
  security definer
  set search_path to 'saku'
  as $$
declare
  app_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'saku_app_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'saku_cron_secret');
begin
  if app_url is null or secret is null then return; end if;
  if not exists (select 1 from saku.push_schedule where send_at <= now()) then return; end if;
  perform net.http_post(
    url := app_url || '/api/cron/push',
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function saku.request_push_send() from public, anon, authenticated;

select cron.schedule('saku-send-push', '*/5 * * * *', 'select saku.request_push_send()');
