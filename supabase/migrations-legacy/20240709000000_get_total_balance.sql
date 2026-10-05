-- Function to calculate total balance optionally for a single account
create or replace function get_total_balance(account_id uuid default null)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(balance), 0) from (
    select a.id,
      a.opening_balance
      + coalesce(sum(case when t.type = 'income' and t.account_id = a.id then t.amount else 0 end), 0)
      - coalesce(sum(case when t.type = 'expense' and t.account_id = a.id then t.amount else 0 end), 0)
      - coalesce(sum(case when t.type = 'transfer' and t.from_account_id = a.id then t.amount else 0 end), 0)
      + coalesce(sum(case when t.type = 'transfer' and t.to_account_id = a.id then t.amount else 0 end), 0)
      as balance
    from accounts a
    left join transactions t
      on t.user_id = a.user_id
      and (
        t.account_id = a.id
        or t.from_account_id = a.id
        or t.to_account_id = a.id
      )
    where a.user_id = auth.uid()
      and (account_id is null or a.id = account_id)
    group by a.id, a.opening_balance
  ) s;
$$;

grant execute on function get_total_balance(uuid) to authenticated, service_role;
