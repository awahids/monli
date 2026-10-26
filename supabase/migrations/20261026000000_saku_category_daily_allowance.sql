-- Budgeted money that is not spent day to day (savings, investments) can be
-- left out of the home screen's daily allowance (lib/dashboard.ts).
alter table saku.categories add column daily_allowance boolean not null default true;

-- Savings categories are the clear case; anything else stays in until the
-- user turns it off in Settings > Categories.
update saku.categories set daily_allowance = false
 where type = 'expense'
   and (name ilike '%tabung%' or name ilike '%invest%' or name ilike '%dana darurat%');
