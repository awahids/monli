-- Budget periods can start on any day (e.g. payday the 25th): from that day
-- on, transactions default to next month's budget. 1 = calendar month.
-- Days past a month's end are clamped to its last day by the app.
alter table saku.profiles
  add column budget_start_day smallint not null default 1
    check (budget_start_day between 1 and 31);
