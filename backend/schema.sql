-- ============================================================
-- ESQUEMA DE BASE DE DATOS — VOLAGANGA
-- Pensado para Supabase (Postgres gratis). Pega esto en:
-- Supabase > tu proyecto > SQL Editor > New query > Run
-- ============================================================

-- Rutas que queremos vigilar (las que muestres en la home)
create table if not exists routes (
  id bigserial primary key,
  origin text not null,          -- código IATA, ej: 'MAD'
  destination text not null,     -- código IATA, ej: 'FCO'
  label text,                    -- nombre bonito, ej: 'Madrid → Roma'
  active boolean default true,
  created_at timestamptz default now(),
  unique (origin, destination)
);

-- Cada precio que encontramos al barrer, para poder calcular
-- el "precio de mercado" (media histórica) de cada ruta.
create table if not exists price_history (
  id bigserial primary key,
  route_id bigint references routes(id) on delete cascade,
  price numeric not null,
  currency text default 'EUR',
  depart_date date,
  return_date date,
  found_at timestamptz default now()
);

create index if not exists idx_price_history_route on price_history(route_id, found_at desc);

-- Chollos ya detectados y calculados (lo que lee la web pública)
create table if not exists deals (
  id bigserial primary key,
  route_id bigint references routes(id) on delete cascade,
  price numeric not null,
  market_price numeric not null,     -- media de referencia con la que se comparó
  discount_pct numeric not null,
  currency text default 'EUR',
  depart_date date,
  return_date date,
  affiliate_url text,
  detected_at timestamptz default now(),
  is_active boolean default true
);

create index if not exists idx_deals_active on deals(is_active, discount_pct desc);

-- Personas suscritas a avisos por email
create table if not exists subscribers (
  id bigserial primary key,
  email text unique not null,
  preferred_origin text,             -- ej: 'MAD', opcional
  min_discount_pct numeric default 30, -- solo avisar si el descuento es >= a esto
  confirmed boolean default false,   -- ver nota sobre doble opt-in en el README
  created_at timestamptz default now()
);

-- Suscripciones a notificaciones push del navegador
create table if not exists push_subscriptions (
  id bigserial primary key,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  min_discount_pct numeric default 30,
  created_at timestamptz default now()
);

-- Registro de qué chollos ya se han notificado, para no repetir avisos
create table if not exists notifications_sent (
  id bigserial primary key,
  deal_id bigint references deals(id) on delete cascade,
  channel text not null,          -- 'email' | 'push'
  recipient text not null,        -- email o endpoint
  sent_at timestamptz default now(),
  unique (deal_id, channel, recipient)
);

-- ------------------------------------------------------------
-- Seguridad (RLS): la web pública solo puede LEER deals/routes
-- y ESCRIBIR (insertar) su propia suscripción. Todo lo demás
-- solo lo toca el backend con la clave "service role" (secreta).
-- ------------------------------------------------------------
alter table routes enable row level security;
alter table deals enable row level security;
alter table subscribers enable row level security;
alter table push_subscriptions enable row level security;

create policy "Lectura pública de rutas" on routes for select using (true);
create policy "Lectura pública de chollos" on deals for select using (true);

create policy "Cualquiera puede suscribirse por email" on subscribers
  for insert with check (true);

create policy "Cualquiera puede registrar su push" on push_subscriptions
  for insert with check (true);

-- Rutas de ejemplo para empezar a rastrear (edítalas a tu gusto)
insert into routes (origin, destination, label) values
  ('MAD', 'FCO', 'Madrid → Roma'),
  ('BCN', 'LIS', 'Barcelona → Lisboa'),
  ('VLC', 'NAP', 'Valencia → Nápoles'),
  ('AGP', 'RAK', 'Málaga → Marrakech')
on conflict (origin, destination) do nothing;
