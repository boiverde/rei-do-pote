-- FIX RPC: Dynamic Share Pricing (Weighted Parimutuel)

-- 1. Ensure columns exist and types are correct (Idempotent)
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  market_id text NOT NULL,
  outcome text NOT NULL,
  type text NOT NULL,
  shares numeric NOT NULL,
  price numeric NOT NULL,
  status text DEFAULT 'open',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE orders ALTER COLUMN market_id TYPE text;

CREATE TABLE IF NOT EXISTS positions (
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  market_id text NOT NULL,
  outcome text NOT NULL,
  shares numeric DEFAULT 0,
  avg_price numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, market_id, outcome)
);
ALTER TABLE positions ALTER COLUMN market_id TYPE text;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own positions" ON positions;
CREATE POLICY "Users can view their own positions" ON positions FOR SELECT USING (auth.uid() = user_id);

-- 2. Drop old function
DROP FUNCTION IF EXISTS place_fantasy_order(uuid, text, numeric);
DROP FUNCTION IF EXISTS place_fantasy_order(text, text, numeric);

-- 3. New Dynamic Pricing RPC
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
BEGIN
    v_user_id := auth.uid();

    -- Check Market & Get Pools
    SELECT total_pool_home, total_pool_away 
    INTO v_pool_home, v_pool_away 
    FROM markets 
    WHERE id = p_market_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mercado não encontrado');
    END IF;

    -- Handle Nulls
    v_pool_home := COALESCE(v_pool_home, 0);
    v_pool_away := COALESCE(v_pool_away, 0);
    v_total_pool := v_pool_home + v_pool_away;

    -- CALCULATE SHARE PRICE (Dynamic)
    -- Logic: Price = Side Pool / Total Pool
    IF v_total_pool = 0 THEN
        v_price := 0.50; -- Initial price for empty market
    ELSE
        IF p_outcome = 'home' THEN
            v_price := v_pool_home / v_total_pool;
        ELSE
            v_price := v_pool_away / v_total_pool;
        END IF;
    END IF;

    -- Floor Price to avoid division by zero or infinite shares
    -- If price is 0 (e.g. side has 0 money but other side has money), set to 0.01 (1 cent)
    IF v_price < 0.01 THEN 
        v_price := 0.01; 
    END IF;

    -- Calculate Shares to Issue
    -- Example: Invest 100 at Price 0.50 -> Get 200 Shares
    v_shares := p_amount / v_price;

    -- Deduct Balance
    UPDATE profiles 
    SET balance = balance - p_amount
    WHERE id = v_user_id AND balance >= p_amount;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente');
    END IF;

    -- Record Order (Store the calculated Price and Shares)
    INSERT INTO orders (user_id, market_id, outcome, type, shares, price, status)
    VALUES (v_user_id, p_market_id, p_outcome, 'buy', v_shares, v_price, 'open'); 

    -- Record Position (Update Weighted Average Price)
    INSERT INTO positions (user_id, market_id, outcome, shares, avg_price)
    VALUES (v_user_id, p_market_id, p_outcome, v_shares, v_price)
    ON CONFLICT (user_id, market_id, outcome)
    DO UPDATE SET 
        avg_price = ((positions.avg_price * positions.shares) + (EXCLUDED.avg_price * EXCLUDED.shares)) / (positions.shares + EXCLUDED.shares),
        shares = positions.shares + EXCLUDED.shares;

    -- Update Market Pool (Money)
    IF p_outcome = 'home' THEN
        UPDATE markets SET total_pool_home = total_pool_home + p_amount WHERE id = p_market_id;
    ELSIF p_outcome = 'away' THEN
        UPDATE markets SET total_pool_away = total_pool_away + p_amount WHERE id = p_market_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Investimento realizado! Cotas: ' || round(v_shares, 2));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
