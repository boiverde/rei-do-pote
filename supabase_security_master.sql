-- 1. Atomic Deposit Request (Metadata only, no balance change yet)
CREATE OR REPLACE FUNCTION public.deposit_funds(
  p_amount decimal,
  p_description text DEFAULT 'Depósito via PIX'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to ensure consistent behavior
AS $$
DECLARE
  v_user_id uuid;
  v_new_balance decimal;
BEGIN
  v_user_id := auth.uid();

  -- Validation
  IF p_amount <= 0 THEN
      RETURN json_build_object('success', false, 'error', 'Valor deve ser positivo');
  END IF;

  -- Log Transaction (Pending)
  INSERT INTO transactions (user_id, amount, type, status, description)
  VALUES (v_user_id, p_amount, 'deposit', 'pending', p_description);

  -- Return success (Balance not updated yet)
  RETURN json_build_object('success', true, 'message', 'Depósito iniciado');
END;
$$;


-- 2. Atomic Confirm Deposit (Callback from Webhook)
CREATE OR REPLACE FUNCTION public.confirm_deposit(
  p_payment_id text,
  p_status text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction record;
  v_new_balance decimal;
  v_user_id uuid;
BEGIN
  -- 1. Lock Transaction Row to prevent concurrent updates
  SELECT * INTO v_transaction 
  FROM transactions 
  WHERE payment_id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  IF v_transaction.status = 'completed' THEN
     RETURN json_build_object('success', true, 'message', 'Already completed');
  END IF;

  -- 2. Update Transaction Status
  UPDATE transactions 
  SET status = p_status,
      created_at = now() 
  WHERE id = v_transaction.id;

  -- 3. Update User Balance (Only if approved)
  IF p_status = 'approved' OR p_status = 'completed' THEN
      -- LOCK USER PROFILE
      PERFORM 1 FROM profiles WHERE id = v_transaction.user_id FOR UPDATE;

      UPDATE profiles 
      SET balance = balance + v_transaction.amount 
      WHERE id = v_transaction.user_id
      RETURNING balance INTO v_new_balance;
      
      RETURN json_build_object('success', true, 'new_balance', v_new_balance);
  ELSE
      RETURN json_build_object('success', true, 'message', 'Status updated to ' || p_status);
  END IF;
END;
$$;


-- 3. Atomic Withdrawal Request (Consuming Balance)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount decimal,
  p_metadata jsonb
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance decimal;
  v_new_balance decimal;
BEGIN
  v_user_id := auth.uid();

  -- Validation
  IF p_amount <= 0 THEN
      RETURN json_build_object('success', false, 'error', 'Valor inválido');
  END IF;

  -- LOCK THE ROW: 'FOR UPDATE' prevents race conditions
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance < p_amount THEN
     RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  -- Deduct Balance
  UPDATE profiles 
  SET balance = balance - p_amount 
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  -- Create Transaction
  INSERT INTO transactions (user_id, amount, type, status, description, metadata)
  VALUES (v_user_id, p_amount, 'withdraw', 'pending', 'Solicitação de Saque', p_metadata);

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;


-- 4. Secure Betting / Order Placement (Anti-Past Posting + Locking)
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

    -- 2. Lock User Balance (Anti-Race Condition)
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente');
    END IF;

    -- 3. Calculate Logic
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
