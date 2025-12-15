-- SECURITY HARDENING RPCs

-- 1. Anti-Double Spend: Request Withdrawal with Row Locking
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

  -- LOCK THE ROW: 'FOR UPDATE' prevents other transactions from reading this row until we commit.
  select balance into v_current_balance
  from profiles
  where id = v_user_id
  for update; -- <--- CRITICAL SECURITY FIX

  if v_current_balance < p_amount then
     return json_build_object('success', false, 'error', 'Saldo insuficiente');
  end if;

  -- Deduct Balance
  update profiles 
  set balance = balance - p_amount 
  where id = v_user_id
  returning balance into v_new_balance;

  -- Create Transaction
  insert into transactions (user_id, amount, type, status, description, metadata)
  values (v_user_id, p_amount, 'withdraw', 'pending', 'Solicitação de Saque', p_metadata);

  return json_build_object('success', true, 'new_balance', v_new_balance);
end;
$$;


-- 2. Anti-Past Posting: Betting RPC with Strict Server Time Check (5 min Buffer)
-- Replacing 'place_fantasy_order' (The active one from fixes)
CREATE OR REPLACE FUNCTION place_fantasy_order(
    p_market_id text,
    p_outcome text,
    p_amount numeric
) RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_pool_home numeric;
    v_pool_away numeric;
    v_total_pool numeric;
    v_price numeric;
    v_shares numeric;
    v_event_date timestamp with time zone;
    v_current_balance numeric;
BEGIN
    v_user_id := auth.uid();

    -- 1. Check Market Time & Existence
    SELECT total_pool_home, total_pool_away, event_date
    INTO v_pool_home, v_pool_away, v_event_date
    FROM markets 
    WHERE id = p_market_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mercado não encontrado');
    END IF;

    -- STRICT TIME CHECK: Now < (Event - 5 Minutes)
    IF now() > (v_event_date - interval '5 minutes') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Apostas encerradas! O jogo começa em breve (ou já começou).');
    END IF;

    -- 2. Lock User Balance (Anti-Race Condition for Bets too!)
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente');
    END IF;

    -- 3. Calculate Logic (Same as before)
    v_pool_home := COALESCE(v_pool_home, 0);
    v_pool_away := COALESCE(v_pool_away, 0);
    v_total_pool := v_pool_home + v_pool_away;

    IF v_total_pool = 0 THEN
        v_price := 0.50; 
    ELSE
        IF p_outcome = 'home' THEN
            v_price := v_pool_home / v_total_pool;
        ELSE
            v_price := v_pool_away / v_total_pool;
        END IF;
    END IF;

    IF v_price < 0.01 THEN v_price := 0.01; END IF;
    v_shares := p_amount / v_price;

    -- 4. Deduct Balance
    UPDATE profiles 
    SET balance = balance - p_amount
    WHERE id = v_user_id;

    -- 5. Record Order & Position
    INSERT INTO orders (user_id, market_id, outcome, type, shares, price, status)
    VALUES (v_user_id, p_market_id, p_outcome, 'buy', v_shares, v_price, 'open'); 

    INSERT INTO positions (user_id, market_id, outcome, shares, avg_price)
    VALUES (v_user_id, p_market_id, p_outcome, v_shares, v_price)
    ON CONFLICT (user_id, market_id, outcome)
    DO UPDATE SET 
        avg_price = ((positions.avg_price * positions.shares) + (EXCLUDED.avg_price * EXCLUDED.shares)) / (positions.shares + EXCLUDED.shares),
        shares = positions.shares + EXCLUDED.shares;

    -- 6. Update Market Pool
    IF p_outcome = 'home' THEN
        UPDATE markets SET total_pool_home = total_pool_home + p_amount WHERE id = p_market_id;
    ELSIF p_outcome = 'away' THEN
        UPDATE markets SET total_pool_away = total_pool_away + p_amount WHERE id = p_market_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Investimento realizado! Cotas: ' || round(v_shares, 2));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
