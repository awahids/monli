alter table transactions add column if not exists budget_month text;
alter table transactions add column if not exists actual_date date;

update transactions set actual_date = created_at::date, budget_month = to_char(date, 'YYYY-MM');

alter table transactions alter column actual_date set not null;
alter table transactions alter column budget_month set not null;

alter table transactions alter column actual_date set default (timezone('utc', now()))::date;
alter table transactions alter column budget_month set default to_char(timezone('utc', now()), 'YYYY-MM');
