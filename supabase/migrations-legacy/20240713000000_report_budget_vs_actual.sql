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
month_bounds as (
  select
    to_date(month_in || '-01', 'YYYY-MM-DD') as start_date,
    (to_date(month_in || '-01', 'YYYY-MM-DD') + interval '1 month')::date as end_date
),
planned as (
  select bi.category_id,
         sum(bi.amount)::numeric as planned
  from budgets b
  join me on me.uid = b.user_id
  join budget_items bi on bi.budget_id = b.id
  join categories c on c.id = bi.category_id
  where b.month = month_in
    and c.type = type_in::category_type
  group by bi.category_id
),
actual as (
  select t.category_id,
         sum(t.amount)::numeric as actual
  from transactions t
  join me on me.uid = t.user_id
  join month_bounds mb on true
  join categories c on c.id = t.category_id
  where t.type = type_in::transaction_type
    and t.category_id is not null
    and t.date >= mb.start_date and t.date < mb.end_date
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
