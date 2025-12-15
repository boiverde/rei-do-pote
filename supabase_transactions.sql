-- 1. Create Transactions Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  amount decimal(10,2) not null,
  type text not null check (type in ('deposit', 'withdraw')),
  status text not null default 'pending',
  description text,
  payment_id text unique,
  external_reference text,
  metadata jsonb
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

-- 5. Atomic Confirm Deposit Function
create or replace function public.confirm_deposit(
  p_payment_id text,
  p_status text
) returns json
language plpgsql
security definer
as $$
declare
  v_transaction record;
  v_new_balance decimal;
  v_user_id uuid;
begin
  -- 1. Get Transaction
  select * into v_transaction 
  from transactions 
  where payment_id = p_payment_id;

  if not found then
    return json_build_object('success', false, 'error', 'Transaction not found');
  end if;

  if v_transaction.status = 'completed' then
     return json_build_object('success', true, 'message', 'Already completed');
  end if;

  -- 2. Update Transaction
  update transactions 
  set status = p_status,
      created_at = now() -- Update time to completion time optional
  where id = v_transaction.id;

  -- 3. Update Balance if approved
  if p_status = 'approved' or p_status = 'completed' then
      update profiles 
      set balance = balance + v_transaction.amount 
      where id = v_transaction.user_id
      returning balance into v_new_balance;
      
      return json_build_object('success', true, 'new_balance', v_new_balance);
  else
      return json_build_object('success', true, 'message', 'Status updated to ' || p_status);
  end if;
end;

-- 6. Atomic Withdrawal Request Function
create or replace function public.request_withdrawal(
  p_amount decimal,
  p_metadata jsonb
) returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_current_balance decimal;
  v_new_balance decimal;
begin
  v_user_id := auth.uid();

  -- 1. Check Balance
  select balance into v_current_balance
  from profiles
  where id = v_user_id;

  if v_current_balance < p_amount then
     return json_build_object('success', false, 'error', 'Saldo insuficiente');
  end if;

  -- 2. Deduct Balance
  update profiles 
  set balance = balance - p_amount 
  where id = v_user_id
  returning balance into v_new_balance;

  -- 3. Create Transaction
  insert into transactions (user_id, amount, type, status, description, metadata)
  values (v_user_id, p_amount, 'withdraw', 'pending', 'Solicitação de Saque', p_metadata);

  return json_build_object('success', true, 'new_balance', v_new_balance);
end;
$$;
