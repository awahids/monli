create table ai_logs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  feature text not null,
  created_at timestamptz default now()
);

create index ai_logs_email_idx on ai_logs(email);
create index ai_logs_feature_idx on ai_logs(feature);

alter table ai_logs enable row level security;
create policy "AI logs are accessible by owner" on ai_logs
  for all using ((auth.jwt()->>'email') = email) with check ((auth.jwt()->>'email') = email);
