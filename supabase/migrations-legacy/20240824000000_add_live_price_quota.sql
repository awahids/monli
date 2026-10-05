alter table public.profiles
  add column if not exists live_price_used_at timestamptz;
