-- Arisan (lib/arisan.ts): a group where every member puts in the same amount
-- each round and one member, in turn, takes the whole pot. An arisan has as
-- many rounds as members; round k falls `k - 1` weeks or months after
-- start_date and goes to the member whose turn is k. Payments record who
-- put in for which round. Nothing here moves an account balance.

create table saku.arisans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references saku.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- What each member puts in per round.
  amount numeric not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  start_date date not null,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create index arisans_user_id_idx on saku.arisans (user_id);

create table saku.arisan_members (
  id uuid primary key default gen_random_uuid(),
  arisan_id uuid not null references saku.arisans(id) on delete cascade,
  user_id uuid not null references saku.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- The round this member takes the pot.
  turn integer not null check (turn >= 1),
  -- The member who is the user, for "your payment" and "your turn".
  is_me boolean not null default false,
  unique (arisan_id, turn) deferrable initially deferred
);

create index arisan_members_arisan_id_idx on saku.arisan_members (arisan_id);

create table saku.arisan_payments (
  member_id uuid not null references saku.arisan_members(id) on delete cascade,
  round integer not null check (round >= 1),
  arisan_id uuid not null references saku.arisans(id) on delete cascade,
  user_id uuid not null references saku.profiles(id) on delete cascade,
  paid_on date not null default current_date,
  primary key (member_id, round)
);

create index arisan_payments_arisan_id_idx on saku.arisan_payments (arisan_id);

-- Same access as the other data tables: owner and editors write, members read.
alter table saku.arisans enable row level security;
alter table saku.arisan_members enable row level security;
alter table saku.arisan_payments enable row level security;

create policy "Arisans are accessible by owner" on saku.arisans
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
create policy "Space members can read" on saku.arisans
  for select using (user_id in (select saku.readable_owner_ids()));

create policy "Arisan members are accessible by owner" on saku.arisan_members
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
create policy "Space members can read" on saku.arisan_members
  for select using (user_id in (select saku.readable_owner_ids()));

create policy "Arisan payments are accessible by owner" on saku.arisan_payments
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
create policy "Space members can read" on saku.arisan_payments
  for select using (user_id in (select saku.readable_owner_ids()));
