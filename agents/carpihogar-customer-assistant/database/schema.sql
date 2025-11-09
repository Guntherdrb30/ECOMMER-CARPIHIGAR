-- Carpihogar Customer Assistant schema (agent-facing tables)
-- Note: products table is expected to exist in main DB; we reference it by id (TEXT)

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id text not null references products(id) on delete restrict,
  quantity int not null default 1,
  price_usd numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(cart_id, product_id)
);

-- Optional images table (products table may already carry images[])
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  cart_id uuid references carts(id) on delete set null,
  total numeric(12,2) not null default 0,
  status text not null check (status in ('draft','pending_confirmation','awaiting_payment','payment_pending_review','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id) on delete restrict,
  quantity int not null default 1,
  price_usd numeric(10,2) not null default 0
);

create table if not exists order_auth_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, token)
);

create table if not exists order_pending_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null default 0,
  reference text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

