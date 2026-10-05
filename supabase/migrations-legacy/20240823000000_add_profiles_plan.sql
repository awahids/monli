alter table public.profiles
  add column if not exists plan text not null default 'PRO';
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('FREE','PRO'));
