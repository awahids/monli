create table ai_logs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  feature text not null,
  created_at timestamptz default now()
);

create index ai_logs_email_idx on ai_logs(email);
create index ai_logs_feature_idx on ai_logs(feature);
