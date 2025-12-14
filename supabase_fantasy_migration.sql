-- Add Pool Columns to Markets
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS total_pool_home numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pool_away numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_percent numeric DEFAULT 0.10; -- 10% Fee

-- Update purchase_shares to increment pools
-- This is a simplified logic. In a real parimutuel, we just track the money in.
CREATE OR REPLACE FUNCTION place_fantasy_order(
    p_market_id uuid,
    p_outcome text,
    p_amount numeric
) RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_market_exists boolean;
BEGIN
    v_user_id := auth.uid();

    -- Check if market exists
    IF NOT EXISTS (SELECT 1 FROM markets WHERE id = p_market_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Market not found');
    END IF;

    -- Deduct balance
    UPDATE profiles 
    SET balance = balance - p_amount
    WHERE id = v_user_id AND balance >= p_amount;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente');
    END IF;

    -- Record Order
    INSERT INTO orders (user_id, market_id, outcome, shares, price, status)
    VALUES (v_user_id, p_market_id, p_outcome, p_amount, 1.0, 'open'); 
    -- Note: In pool, "shares" = amount invested for now, price = 1.0 placeholder

    -- Record Position (Aggregate)
    INSERT INTO positions (user_id, market_id, outcome, shares, avg_price)
    VALUES (v_user_id, p_market_id, p_outcome, p_amount, 1.0)
    ON CONFLICT (user_id, market_id, outcome)
    DO UPDATE SET 
        shares = positions.shares + p_amount,
        avg_price = 1.0; -- Keep simple for pool

    -- Update Market Pool
    IF p_outcome = 'home' THEN
        UPDATE markets SET total_pool_home = total_pool_home + p_amount WHERE id = p_market_id;
    ELSIF p_outcome = 'away' THEN
        UPDATE markets SET total_pool_away = total_pool_away + p_amount WHERE id = p_market_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Investimento realizado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
