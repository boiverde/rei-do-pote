-- 1. Create Transactions Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  amount decimal(10,2) not null,
  type text not null check (type in ('deposit', 'withdraw')),
  status text not null default 'pending',
  description text
);

-- 2. Enable RLS
alter table public.transactions enable row level security;

-- 3. Policies
drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own transactions" on public.transactions;
create policy "Users can create their own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

-- 4. Atomic Deposit Function (RPC)
drop function if exists public.deposit_funds;

create or replace function public.deposit_funds(
  p_amount decimal,
  p_description text default 'Depósito via PIX'
) returns json
language plpgsql
as $$
declare
  v_user_id uuid;
  v_new_balance decimal;
begin
  v_user_id := auth.uid();

  -- 1. Log Transaction
  insert into transactions (user_id, amount, type, status, description)
  values (v_user_id, p_amount, 'deposit', 'completed', p_description);

  -- 2. Update Balance
  update profiles 
  set balance = balance + p_amount 
  where id = v_user_id
  returning balance into v_new_balance;

  return json_build_object('success', true, 'new_balance', v_new_balance);
end;
$$;
