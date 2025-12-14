-- Create Orders Table (if not exists)
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  market_id text references markets(id) not null,
  outcome text not null,
  type text not null,
  shares integer not null check (shares > 0),
  price decimal(4,2) not null,
  status text default 'filled'
);

-- Create Positions Table (if not exists)
create table if not exists public.positions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  market_id text references markets(id) not null,
  outcome text not null,
  shares integer not null default 0,
  avg_price decimal(4,2) not null default 0,
  unique(user_id, market_id, outcome)
);

-- Enable RLS (safe to run multiple times)
alter table public.orders enable row level security;
alter table public.positions enable row level security;

-- Policies (Drop first to allow recreation)
-- Policies (Drop first to allow recreation)
-- ORDERS
drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own orders" on public.orders;
create policy "Users can insert their own orders" on public.orders for insert with check (auth.uid() = user_id);

-- POSITIONS
drop policy if exists "Users can view their own positions" on public.positions;
create policy "Users can view their own positions" on public.positions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own positions" on public.positions;
create policy "Users can insert their own positions" on public.positions for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own positions" on public.positions;
create policy "Users can update their own positions" on public.positions for update using (auth.uid() = user_id);

-- Drop first to clear state
drop function if exists public.purchase_shares;

-- Atomic Purchase Function (RPC)
-- SECURITY INVOKER: Runs with permissions of the user calling the function.
create or replace function public.purchase_shares(
  p_market_id text,
  p_outcome text,
  p_shares integer,
  p_price decimal
) returns json
language plpgsql
security definer -- Run as creator (Bypass RLS)
set search_path = public -- Secure search path
as $$
declare
  v_user_id uuid;
  current_balance decimal;
  total_cost decimal;
begin
  v_user_id := auth.uid(); -- Still gets the calling user's ID
  total_cost := p_shares * p_price;

  -- 1. Check Balance
  select balance into current_balance from profiles where id = v_user_id;
  
  if current_balance is null then
     return json_build_object('success', false, 'message', 'Perfil não encontrado. Tente fazer login novamente.');
  end if;

  if current_balance < total_cost then
    return json_build_object('success', false, 'message', 'Saldo insuficiente.');
  end if;

  -- 2. Deduct Balance
  update profiles set balance = balance - total_cost where id = v_user_id;

  -- 3. Create Order
  insert into orders (user_id, market_id, outcome, type, shares, price)
  values (v_user_id, p_market_id, p_outcome, 'buy', p_shares, p_price);

  -- 4. Update/Create Position
  insert into positions (user_id, market_id, outcome, shares, avg_price)
  values (v_user_id, p_market_id, p_outcome, p_shares, p_price)
  on conflict (user_id, market_id, outcome)
  do update set 
    avg_price = ((positions.avg_price * positions.shares) + (EXCLUDED.avg_price * EXCLUDED.shares)) / (positions.shares + EXCLUDED.shares),
    shares = positions.shares + EXCLUDED.shares;

  -- 5. Update Market Volume
  update markets set volume = volume + total_cost where id = p_market_id;

  return json_build_object('success', true, 'new_balance', current_balance - total_cost);
end;
$$;
