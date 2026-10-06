-- Shared spaces ("Kelola bersama").
--
-- A PRO user (the owner) invites up to 4 people, e.g. family. Once they accept,
-- they can work inside the owner's space: their requests use the owner's id as
-- user_id, and the policies below let them read (viewer) or also change
-- (editor) the owner's rows. Their own space is untouched. Access lapses
-- automatically while the owner is not on PRO.
--
-- Applied to the awhids project in three steps (saku_shared_spaces_members,
-- saku_shared_spaces_policies, saku_shared_spaces_rpcs) because one large
-- apply timed out; the end state is this file.

create table saku.space_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references saku.profiles(id) on delete cascade,
  member_id uuid references saku.profiles(id) on delete cascade,
  -- Invites are bound to this address; the invitee must sign in with it.
  email text not null check (email = lower(email) and position('@' in email) > 1),
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'active')),
  -- Secret in the invite link. Rotated on accept so a link works once.
  token uuid not null default gen_random_uuid() unique,
  member_name text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (owner_id, email),
  check (member_id is null or member_id <> owner_id),
  check ((status = 'active') = (member_id is not null))
);

create index space_members_member_idx on saku.space_members (member_id) where status = 'active';

alter table saku.space_members enable row level security;

create policy "Space members visible to owner and member" on saku.space_members
  for select using (owner_id = (select auth.uid()) or member_id = (select auth.uid()));

-- Owners invite; only PRO owners, only as pending invites for someone else.
create policy "Owners invite" on saku.space_members
  for insert with check (
    owner_id = (select auth.uid())
    and status = 'pending'
    and member_id is null
    and exists (select 1 from saku.profiles p where p.id = (select auth.uid()) and p.plan = 'PRO')
  );

create policy "Owners change roles" on saku.space_members
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Owners remove people; members can leave.
create policy "Owners remove, members leave" on saku.space_members
  for delete using (owner_id = (select auth.uid()) or member_id = (select auth.uid()));

-- The schema's default privileges grant full UPDATE; narrow it to the role.
revoke all on saku.space_members from authenticated, anon;
grant select, insert, delete on saku.space_members to authenticated;
-- Owners may only change the role; accepting goes through accept_space_invite().
grant update (role) on saku.space_members to authenticated;
grant all on saku.space_members to service_role;

create function saku.enforce_space_member_limit() returns trigger
  language plpgsql
  set search_path to 'saku'
  as $$
begin
  if (select count(*) from space_members where owner_id = new.owner_id) >= 4 then
    raise exception 'member_limit';
  end if;
  return new;
end;
$$;

create trigger space_members_limit before insert on saku.space_members
  for each row execute function saku.enforce_space_member_limit();

-- Spaces the current user may read: their own plus any PRO space they joined.
create function saku.readable_owner_ids() returns setof uuid
  language sql stable security definer
  set search_path to 'saku'
  as $$
  select auth.uid()
  union all
  select m.owner_id
    from space_members m
    join profiles p on p.id = m.owner_id
   where m.member_id = auth.uid() and m.status = 'active' and p.plan = 'PRO';
$$;

-- Same, limited to spaces where they are an editor.
create function saku.writable_owner_ids() returns setof uuid
  language sql stable security definer
  set search_path to 'saku'
  as $$
  select auth.uid()
  union all
  select m.owner_id
    from space_members m
    join profiles p on p.id = m.owner_id
   where m.member_id = auth.uid() and m.status = 'active' and m.role = 'editor' and p.plan = 'PRO';
$$;

-- Details shown on the invite page before accepting. Knowing the token is
-- what authorises this, as with the link itself.
create function saku.space_invite_info(invite_token uuid)
  returns table (owner_name text, email text, role text, status text)
  language sql stable security definer
  set search_path to 'saku'
  as $$
  select p.name, m.email, m.role, m.status
    from space_members m
    join profiles p on p.id = m.owner_id
   where m.token = invite_token;
$$;

create function saku.accept_space_invite(invite_token uuid) returns saku.space_members
  language plpgsql security definer
  set search_path to 'saku'
  as $$
declare
  me profiles;
  inv space_members;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then
    raise exception 'not_authenticated';
  end if;

  select * into inv from space_members where token = invite_token for update;
  if inv.id is null then
    raise exception 'invite_not_found';
  end if;
  if inv.owner_id = me.id then
    raise exception 'own_space';
  end if;
  if inv.status = 'active' then
    raise exception 'invite_used';
  end if;
  if lower(me.email) <> inv.email then
    raise exception 'email_mismatch';
  end if;
  if not exists (select 1 from profiles where id = inv.owner_id and plan = 'PRO') then
    raise exception 'owner_not_pro';
  end if;

  update space_members
     set member_id = me.id,
         member_name = me.name,
         status = 'active',
         accepted_at = now(),
         token = gen_random_uuid()
   where id = inv.id
  returning * into inv;
  return inv;
end;
$$;

-- Data tables. The existing owner-only policies (FOR ALL) are narrowed to
-- "owner or editor" for every command, and a separate SELECT policy opens
-- reading to viewers too. Permissive policies are OR-ed, so viewers can read
-- but not insert, update or delete. Altering the policies in place keeps every
-- table protected throughout the migration.
alter policy "Accounts are accessible by owner" on saku.accounts
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
alter policy "Budgets are accessible by owner" on saku.budgets
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
alter policy "Categories are accessible by owner" on saku.categories
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
alter policy "Recurring transactions are accessible by owner" on saku.recurring_transactions
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
alter policy "Savings goals are accessible by owner" on saku.savings_goals
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
alter policy "Transactions are accessible by owner" on saku.transactions
  using (user_id in (select saku.writable_owner_ids())) with check (user_id in (select saku.writable_owner_ids()));
alter policy "Budget items are accessible by owner" on saku.budget_items
  using (exists (select 1 from saku.budgets b where b.id = budget_items.budget_id and b.user_id in (select saku.writable_owner_ids())))
  with check (exists (select 1 from saku.budgets b where b.id = budget_items.budget_id and b.user_id in (select saku.writable_owner_ids())));

create policy "Space members can read" on saku.accounts for select using (user_id in (select saku.readable_owner_ids()));
create policy "Space members can read" on saku.budgets for select using (user_id in (select saku.readable_owner_ids()));
create policy "Space members can read" on saku.categories for select using (user_id in (select saku.readable_owner_ids()));
create policy "Space members can read" on saku.recurring_transactions for select using (user_id in (select saku.readable_owner_ids()));
create policy "Space members can read" on saku.savings_goals for select using (user_id in (select saku.readable_owner_ids()));
create policy "Space members can read" on saku.transactions for select using (user_id in (select saku.readable_owner_ids()));
create policy "Space members can read" on saku.budget_items for select using (
  exists (select 1 from saku.budgets b where b.id = budget_items.budget_id and b.user_id in (select saku.readable_owner_ids()))
);

-- Members see the owner's profile (name, currency, budget period).
create policy "Space members read owner profile" on saku.profiles
  for select using (id in (select saku.readable_owner_ids()));

-- Who recorded a transaction, for spaces with several people.
alter table saku.transactions
  add column created_by uuid default auth.uid() references saku.profiles(id) on delete set null;

-- RPCs: work on the given space instead of always the caller's own.
create or replace function saku.contribute_savings_goal(goal_id uuid, delta numeric) returns setof saku.savings_goals
  language sql
  set search_path to 'saku'
  as $$
  update savings_goals
     set saved_amount = greatest(saved_amount + delta, 0)
   where id = goal_id and user_id in (select writable_owner_ids())
  returning *;
$$;

-- Space-aware versions of get_total_balance and report_budget_vs_actual,
-- under new names so the originals keep working unchanged.
create function saku.space_total_balance(account_id uuid default null, space_owner uuid default null) returns numeric
  language sql stable security definer
  set search_path to 'saku'
  as $_$
  select coalesce(sum(a.current_balance), 0)
  from accounts a
  where a.user_id = coalesce($2, auth.uid())
    and a.user_id in (select readable_owner_ids())
    and (($1 is null and a.archived = false) or a.id = $1);
$_$;

create function saku.space_budget_vs_actual(month_in text, type_in text default 'expense', space_owner uuid default null)
  returns table(category_id uuid, category_name text, planned numeric, actual numeric, diff numeric)
  language sql stable security definer
  set search_path to 'saku'
  as $$
with me as (
  select coalesce(space_owner, auth.uid()) as uid
   where coalesce(space_owner, auth.uid()) in (select readable_owner_ids())
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

revoke execute on all functions in schema saku from public;
grant execute on all functions in schema saku to authenticated, service_role;
