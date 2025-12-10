-- Create a table for markets
create table markets (
  id text primary key, -- Using text id to match the "pal-bot-br25" format
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  home_team text not null,
  away_team text not null,
  league text not null,
  event_date timestamp with time zone not null,
  home_price decimal(4,2) not null check (home_price > 0 and home_price < 1),
  away_price decimal(4,2) not null check (away_price > 0 and away_price < 1),
  volume numeric default 0,
  history jsonb default '[]'::jsonb, -- Storing the price history graph data
  status text default 'open' check (status in ('open', 'closed', 'settled'))
);

-- Enable Row Level Security (RLS)
alter table markets enable row level security;

-- Policy: Anyone can view markets
create policy "Markets are viewable by everyone." on markets
  for select using (true);

-- Policy: Only service_role (or backend logic) can insert/update (for now)
-- You can add policies for admin users later.

-- Seed Data (Matches from mockData.js)
-- Note: Volume is converted to numeric (e.g., 3.5M -> 3500000)

insert into markets (id, home_team, away_team, league, event_date, home_price, away_price, volume)
values
  ('pal-bot-br25', 'Palmeiras', 'Botafogo', 'Brasileirão', '2025-03-29 16:30:00+00', 0.55, 0.45, 3500000),
  ('fla-int-br25', 'Flamengo', 'Internacional', 'Brasileirão', '2025-03-29 21:00:00+00', 0.60, 0.40, 2800000),
  ('bah-cor-br25', 'Bahia', 'Corinthians', 'Brasileirão', '2025-03-29 18:30:00+00', 0.48, 0.52, 1900000),
  ('bra-cor-sp25', 'Bragantino', 'Corinthians', 'Paulistão', '2025-01-15 19:00:00+00', 0.45, 0.55, 900000),
  ('pal-por-sp25', 'Palmeiras', 'Portuguesa', 'Paulistão', '2025-01-15 21:30:00+00', 0.85, 0.15, 1500000),
  ('san-mir-sp25', 'Santos', 'Mirassol', 'Paulistão', '2025-01-16 19:00:00+00', 0.65, 0.35, 800000),
  ('bot-mar-rj25', 'Botafogo', 'Maricá', 'Carioca', '2025-01-11 16:00:00+00', 0.92, 0.08, 600000),
  ('nov-vas-rj25', 'Nova Iguaçu', 'Vasco', 'Carioca', '2025-01-11 16:30:00+00', 0.30, 0.70, 1200000),
  ('fla-boa-rj25', 'Flamengo', 'Boavista', 'Carioca', '2025-01-12 16:00:00+00', 0.88, 0.12, 2500000),
  ('sou-cru-cb25', 'Sousa-PB', 'Cruzeiro', 'Copa do Brasil', '2025-02-21 21:30:00+00', 0.20, 0.80, 400000),
  ('bah-spo-ne25', 'Bahia', 'Sport', 'Copa do Nordeste', '2025-02-05 21:30:00+00', 0.58, 0.42, 1800000),
  ('cea-for-ne25', 'Ceará', 'Fortaleza', 'Copa do Nordeste', '2025-02-08 16:00:00+00', 0.45, 0.55, 2200000),
  ('pay-rem-cv25', 'Paysandu', 'Remo', 'Copa Verde', '2025-03-01 17:00:00+00', 0.50, 0.50, 1500000),
  ('cam-cru-mg25', 'Atlético-MG', 'Cruzeiro', 'Mineiro', '2025-02-02 16:00:00+00', 0.52, 0.48, 3800000),
  ('int-gre-rs25', 'Internacional', 'Grêmio', 'Gaúcho', '2025-02-23 16:00:00+00', 0.50, 0.50, 4500000),
  ('pal-riv-lib25', 'Palmeiras', 'River Plate', 'Libertadores', '2025-04-02 21:30:00+00', 0.55, 0.45, 5000000),
  ('fla-pen-lib25', 'Flamengo', 'Peñarol', 'Libertadores', '2025-04-03 21:30:00+00', 0.70, 0.30, 4200000),
  ('cor-rac-sul25', 'Corinthians', 'Racing', 'Sul-Americana', '2025-04-02 19:00:00+00', 0.60, 0.40, 3100000);
