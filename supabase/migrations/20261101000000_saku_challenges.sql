-- Tantangan hemat (lib/challenges.ts): "5 dari 7 hari tanpa jajan". A
-- challenge watches one expense category (or all spending when it has
-- none) for `length_days` days from `start_date`, and is won once
-- `target_days` of them pass without spending there. Progress is worked
-- out from the transactions, so only the challenge itself is stored.

create table saku.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references saku.profiles(id) on delete cascade,
  category_id uuid references saku.categories(id) on delete cascade,
  length_days integer not null check (length_days between 3 and 30),
  target_days integer not null check (target_days >= 1),
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  check (target_days <= length_days)
);

create index challenges_user_id_idx on saku.challenges (user_id);

-- Same access as the other data tables: owner and editors write, members read.
alter table saku.challenges enable row level security;

create policy "Challenges are accessible by owner" on saku.challenges
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
create policy "Space members can read" on saku.challenges
  for select using (user_id in (select saku.readable_owner_ids()));
