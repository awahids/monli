-- Consolidate duplicate budgets so only one row per user and month remains
delete from budget_items bi
using budgets b1, budgets b2
where bi.budget_id = b1.id
  and b1.user_id = b2.user_id
  and b1.month = b2.month
  and b1.id > b2.id;

delete from budgets b1
using budgets b2
where b1.user_id = b2.user_id
  and b1.month = b2.month
  and b1.id > b2.id;

-- Drop the old account-specific constraint and column
alter table budgets drop constraint if exists budgets_user_id_month_account_id_key;
alter table budgets drop column if exists account_id;

-- Enforce uniqueness on user and month now that budgets are account-agnostic
alter table budgets add constraint budgets_user_id_month_key unique (user_id, month);
