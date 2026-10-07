-- Hutang & piutang.
--
-- A debt is money the user owes someone ("payable", hutang) or someone owes
-- the user ("receivable", piutang). Cash that changes hands is a debt entry:
-- the money borrowed or lent ("principal") and each repayment ("payment").
-- An entry with an account moves that account's balance, but it is not a
-- transaction, so income, expenses, budgets and reports stay untouched.

create table saku.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references saku.profiles(id) on delete cascade,
  kind text not null check (kind in ('payable', 'receivable')),
  person text not null check (char_length(person) between 1 and 80),
  amount numeric not null check (amount > 0),
  -- Sum of payment entries, kept by the trigger below.
  paid numeric not null default 0 check (paid >= 0),
  due_date date,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index debts_user_id_idx on saku.debts (user_id);

create trigger update_debts_updated_at before update on saku.debts
  for each row execute function saku.update_updated_at_column();

create table saku.debt_entries (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references saku.debts(id) on delete cascade,
  user_id uuid not null references saku.profiles(id) on delete cascade,
  kind text not null check (kind in ('principal', 'payment')),
  amount numeric not null check (amount > 0),
  account_id uuid references saku.accounts(id) on delete set null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index debt_entries_debt_id_idx on saku.debt_entries (debt_id);

-- +1 when an entry brings money into the account, -1 when it takes money out:
-- borrowing (payable principal) and being repaid (receivable payment) bring
-- money in; lending and repaying take it out.
create function saku.debt_direction(debt_kind text, entry_kind text) returns numeric
  language sql immutable
  as $$
  select case when (debt_kind = 'payable') = (entry_kind = 'principal') then 1 else -1 end::numeric;
$$;

-- Keeps account balances and debts.paid in step with the entries; deleting an
-- entry reverses it.
create function saku.apply_debt_entry() returns trigger
  language plpgsql
  set search_path to 'saku'
  as $$
declare
  e debt_entries := coalesce(new, old);
  debt_kind text;
  sign numeric := case when tg_op = 'DELETE' then -1 else 1 end;
begin
  select kind into debt_kind from debts where id = e.debt_id;
  -- Debt being deleted: revert_debt_entries already reversed the balances.
  if debt_kind is null then
    return e;
  end if;
  if e.kind = 'payment' then
    update debts set paid = greatest(paid + sign * e.amount, 0) where id = e.debt_id;
  end if;
  if e.account_id is not null then
    update accounts set current_balance = current_balance + sign * debt_direction(debt_kind, e.kind) * e.amount
     where id = e.account_id;
  end if;
  return e;
end;
$$;

create trigger debt_entries_apply after insert or delete on saku.debt_entries
  for each row execute function saku.apply_debt_entry();

-- Deleting a debt reverses its cash movements; the entries then cascade away.
create function saku.revert_debt_entries() returns trigger
  language plpgsql
  set search_path to 'saku'
  as $$
begin
  update accounts a
     set current_balance = a.current_balance - s.total
    from (
      select account_id, sum(debt_direction(old.kind, kind) * amount) as total
        from debt_entries
       where debt_id = old.id and account_id is not null
       group by account_id
    ) s
   where a.id = s.account_id;
  return old;
end;
$$;

create trigger debts_revert_entries before delete on saku.debts
  for each row execute function saku.revert_debt_entries();

-- Same access as the other data tables: owner and editors write, members read.
alter table saku.debts enable row level security;
alter table saku.debt_entries enable row level security;

create policy "Debts are accessible by owner" on saku.debts
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
create policy "Space members can read" on saku.debts
  for select using (user_id in (select saku.readable_owner_ids()));

create policy "Debt entries are accessible by owner" on saku.debt_entries
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
create policy "Space members can read" on saku.debt_entries
  for select using (user_id in (select saku.readable_owner_ids()));

revoke execute on function saku.apply_debt_entry() from public;
revoke execute on function saku.revert_debt_entries() from public;
