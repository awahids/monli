create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null,
  product_name text not null,
  amount integer not null,
  status text not null default 'pending',
  token text not null,
  created_at timestamptz default now()
);

create index payments_user_id_idx on payments(user_id);
create unique index payments_order_id_idx on payments(order_id);
