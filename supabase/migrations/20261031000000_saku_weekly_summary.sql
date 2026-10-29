-- The weekly summary on Sunday at 19:00 (lib/weekly-summary.ts): a reminder
-- of its own kind, which app/api/cron/push fills with the week's numbers.

alter table saku.push_schedule drop constraint push_schedule_kind_check;
alter table saku.push_schedule
  add constraint push_schedule_kind_check check (kind in ('bill', 'daily', 'report', 'weekly', 'other'));
