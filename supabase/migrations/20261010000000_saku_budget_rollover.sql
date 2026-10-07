-- Rollover: a budget can carry what is left of it into the next period.
alter table saku.budgets add column rollover boolean not null default false;

-- What the previous period left over, when that budget carries it over
-- (never negative: overspending does not shrink the next budget). Chains
-- through consecutive periods. PostgREST exposes it as budgets.carry.
create function saku.carry(b saku.budgets) returns numeric
  language plpgsql stable
  set search_path to 'saku'
  as $$
declare
  prev budgets;
  spent numeric;
begin
  select * into prev from budgets
   where user_id = b.user_id
     and month = to_char(to_date(b.month, 'YYYY-MM') - interval '1 month', 'YYYY-MM');
  if prev.id is null or not prev.rollover then
    return 0;
  end if;
  select coalesce(sum(amount), 0) into spent from transactions
   where user_id = b.user_id and type = 'expense' and budget_month = prev.month;
  return greatest(prev.total_amount + carry(prev) - spent, 0);
end;
$$;
