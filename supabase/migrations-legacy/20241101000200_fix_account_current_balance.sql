-- Accounts created from the app's account form were inserted directly
-- without current_balance, so they started at 0 instead of their opening
-- balance (the balance trigger only reacts to transactions).

-- 1. New accounts always start at their opening balance, whatever path
--    inserts them.
create or replace function public.set_account_initial_balance()
returns trigger
language plpgsql
as $$
begin
  new.current_balance := new.opening_balance;
  return new;
end;
$$;

drop trigger if exists accounts_set_initial_balance on public.accounts;
create trigger accounts_set_initial_balance
  before insert on public.accounts
  for each row execute function public.set_account_initial_balance();

-- 2. Recompute every account's balance from its opening balance and
--    transactions (same formula as 20240928000000).
update public.accounts a set current_balance = a.opening_balance
  + coalesce((select sum(amount) from public.transactions t where t.account_id = a.id and t.type = 'income'), 0)
  - coalesce((select sum(amount) from public.transactions t where t.account_id = a.id and t.type = 'expense'), 0)
  - coalesce((select sum(amount) from public.transactions t where t.from_account_id = a.id and t.type = 'transfer'), 0)
  + coalesce((select sum(amount) from public.transactions t where t.to_account_id = a.id and t.type = 'transfer'), 0);
