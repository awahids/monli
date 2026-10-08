-- New accounts get PRO free for 14 days (TRIAL_DAYS in lib/plans.ts).
-- pro_until is when that PRO ends; null means no end (paid PRO, or FREE).
alter table saku.profiles add column pro_until timestamptz;

-- Profiles made with a user's own session (Google sign-in, or an account from
-- another app on the shared project opening Saku for the first time) start
-- the trial here; /api/auth/register sets it for email sign-ups. Users still
-- can't grant themselves PRO or move its end.
create or replace function saku.protect_profile_privileged_columns() returns trigger
    language plpgsql
    set search_path to 'saku'
    as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.plan := 'PRO';
      new.pro_until := now() + interval '14 days';
      new.ai_unlimited := false;
      new.live_price_used_at := null;
    else
      new.plan := old.plan;
      new.pro_until := old.pro_until;
      new.ai_unlimited := old.ai_unlimited;
      new.live_price_used_at := old.live_price_used_at;
    end if;
  end if;
  return new;
end;
$$;

-- Back to FREE once the trial is over; returns how many ended.
create function saku.end_pro_trials() returns integer
    language sql
    security definer
    set search_path to 'saku'
    as $$
  with ended as (
    update profiles set plan = 'FREE', pro_until = null
     where plan = 'PRO' and pro_until <= now()
    returning 1
  )
  select count(*)::integer from ended;
$$;
revoke execute on function saku.end_pro_trials() from public, anon, authenticated;
grant execute on function saku.end_pro_trials() to service_role;

-- Hourly, so a trial runs at most an hour past its end.
create extension if not exists pg_cron;
select cron.schedule('saku-end-pro-trials', '7 * * * *', 'select saku.end_pro_trials()');
