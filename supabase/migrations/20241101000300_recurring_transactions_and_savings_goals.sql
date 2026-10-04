-- Recurring transactions: rules that create real transactions when due.
create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'transfer')),
  account_id uuid references accounts(id) on delete cascade,
  from_account_id uuid references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount numeric not null check (amount > 0),
  note text not null default '',
  frequency text not null check (frequency in ('weekly', 'monthly')),
  -- Monthly rules fall on this day (clamped to the month's last day);
  -- weekly rules repeat every 7 days from start_date.
  day_of_month smallint check (day_of_month between 1 and 31),
  start_date date not null,
  next_date date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (type = 'transfer' and from_account_id is not null and to_account_id is not null
      and from_account_id <> to_account_id and account_id is null and category_id is null)
    or (type <> 'transfer' and account_id is not null
      and from_account_id is null and to_account_id is null)
  ),
  check (frequency = 'weekly' or day_of_month is not null)
);

alter table recurring_transactions enable row level security;
create policy "Recurring transactions are accessible by owner" on recurring_transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger update_recurring_transactions_updated_at before update on recurring_transactions
  for each row execute procedure update_updated_at_column();
create index recurring_transactions_due_idx on recurring_transactions(user_id, next_date)
  where active;

-- Transactions created from a rule point back to it. The unique constraint
-- makes materializing idempotent: running the same occurrence twice (two
-- tabs, a retry) inserts it once. NULLs never conflict, so ordinary
-- transactions are unaffected. (A full constraint rather than a partial
-- index, because PostgREST's on_conflict cannot target a partial index.)
alter table transactions
  add column recurring_id uuid references recurring_transactions(id) on delete set null,
  add constraint transactions_recurring_occurrence_key unique (recurring_id, actual_date);

-- Savings goals.
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  target_date date,
  icon text,
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table savings_goals enable row level security;
create policy "Savings goals are accessible by owner" on savings_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger update_savings_goals_updated_at before update on savings_goals
  for each row execute procedure update_updated_at_column();
create index savings_goals_user_id_idx on savings_goals(user_id);

-- Atomic deposit / withdrawal. Runs as the caller, so RLS still applies.
create or replace function contribute_savings_goal(goal_id uuid, delta numeric)
returns savings_goals
language sql
security invoker
set search_path = public
as $$
  update savings_goals
     set saved_amount = greatest(saved_amount + delta, 0)
   where id = goal_id and user_id = auth.uid()
  returning *;
$$;
