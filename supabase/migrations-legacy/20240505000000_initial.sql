-- Enable uuid extension for generating UUIDs
create extension if not exists "pgcrypto";

-- Function to auto-update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  default_currency text not null default 'IDR',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table profiles enable row level security;
create policy "Profiles are accessible by owner" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

-- Accounts table
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'ewallet', 'cash')),
  currency text not null default 'IDR',
  opening_balance numeric not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table accounts enable row level security;
create policy "Accounts are accessible by owner" on accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger update_accounts_updated_at before update on accounts
  for each row execute procedure update_updated_at_column();
create index accounts_user_id_idx on accounts(user_id);

-- Categories table
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  color text,
  icon text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table categories enable row level security;
create policy "Categories are accessible by owner" on categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger update_categories_updated_at before update on categories
  for each row execute procedure update_updated_at_column();
create index categories_user_id_idx on categories(user_id);

-- Budgets table
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  month text not null,
  account_id uuid not null references accounts(id) on delete cascade,
  total_amount numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, month, account_id)
);

alter table budgets enable row level security;
create policy "Budgets are accessible by owner" on budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger update_budgets_updated_at before update on budgets
  for each row execute procedure update_updated_at_column();
create index budgets_user_id_idx on budgets(user_id);

-- Budget items table
create table budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  amount numeric not null,
  rollover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (budget_id, category_id)
);

alter table budget_items enable row level security;
create policy "Budget items are accessible by owner" on budget_items
  for all using (
    exists (
      select 1 from budgets b
      where b.id = budget_items.budget_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from budgets b
      where b.id = budget_items.budget_id and b.user_id = auth.uid()
    )
  );
create trigger update_budget_items_updated_at before update on budget_items
  for each row execute procedure update_updated_at_column();
create index budget_items_budget_id_idx on budget_items(budget_id);

-- Transactions table
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  type text not null check (type in ('expense', 'income', 'transfer')),
  account_id uuid references accounts(id),
  from_account_id uuid references accounts(id),
  to_account_id uuid references accounts(id),
  amount numeric not null,
  category_id uuid references categories(id),
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table transactions enable row level security;
create policy "Transactions are accessible by owner" on transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger update_transactions_updated_at before update on transactions
  for each row execute procedure update_updated_at_column();
create index transactions_user_id_idx on transactions(user_id);

