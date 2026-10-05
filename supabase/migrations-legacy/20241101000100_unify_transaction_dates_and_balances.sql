-- One date rule for transactions:
--   * actual_date  -> timeline, dashboard charts and reports
--   * budget_month -> budget planned vs actual
-- The legacy `date` column is still written (equal to actual_date) but no
-- longer read.

-- 20240814 backfilled actual_date from created_at while `date` kept the real
-- transaction date. Since then the API writes both columns with the same
-- value, so any mismatch is a legacy row: restore its real date.
update public.transactions
set actual_date = date
where actual_date is distinct from date;

create index if not exists transactions_user_actual_date_idx
  on public.transactions (user_id, actual_date);
create index if not exists transactions_user_budget_month_idx
  on public.transactions (user_id, budget_month);

-- Total balance now reads the trigger-maintained current_balance (the same
-- number the Accounts page shows) and skips archived accounts. The previous
-- version compared against an unqualified `account_id`, which resolved to
-- transactions.account_id instead of the parameter, so the filter was ignored.
create or replace function public.get_total_balance(account_id uuid default null)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(a.current_balance), 0)
  from accounts a
  where a.user_id = auth.uid()
    and (($1 is null and a.archived = false) or a.id = $1);
$$;

grant execute on function public.get_total_balance(uuid) to authenticated, service_role;

-- Budget vs actual: drop casts to enum types that are not defined in this
-- schema (the columns are text) and attribute spending by budget_month.
create or replace function public.report_budget_vs_actual(month_in text, type_in text default 'expense')
returns table (
  category_id uuid,
  category_name text,
  planned numeric,
  actual numeric,
  diff numeric
)
language sql
security definer
set search_path = public
as $$
with me as (
  select auth.uid() as uid
),
planned as (
  select bi.category_id,
         sum(bi.amount)::numeric as planned
  from budgets b
  join me on me.uid = b.user_id
  join budget_items bi on bi.budget_id = b.id
  join categories c on c.id = bi.category_id
  where b.month = month_in
    and c.type::text = type_in
  group by bi.category_id
),
actual as (
  select t.category_id,
         sum(t.amount)::numeric as actual
  from transactions t
  join me on me.uid = t.user_id
  join categories c on c.id = t.category_id
  where t.type::text = type_in
    and t.category_id is not null
    and t.budget_month = month_in
  group by t.category_id
)
select
  coalesce(p.category_id, a.category_id) as category_id,
  (select c.name from categories c where c.id = coalesce(p.category_id, a.category_id)) as category_name,
  coalesce(p.planned, 0)::numeric as planned,
  coalesce(a.actual, 0)::numeric as actual,
  (coalesce(p.planned, 0) - coalesce(a.actual, 0))::numeric as diff
from planned p
full outer join actual a on a.category_id = p.category_id
order by 2 asc;
$$;
