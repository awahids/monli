-- PRO becomes a prepaid period (1 or 12 months) instead of a one-time,
-- lifetime purchase. Each successful payment moves pro_until forward by its
-- months (lib/plans.ts extendProUntil); end_pro_trials() already turns an
-- expired pro_until back to FREE, for trials and paid periods alike.
alter table saku.payments add column months integer not null default 1 check (months > 0);

-- Lifetime buyers get 12 months of PRO from today, then renew like everyone.
update saku.profiles set pro_until = now() + interval '12 months'
 where plan = 'PRO' and pro_until is null;
