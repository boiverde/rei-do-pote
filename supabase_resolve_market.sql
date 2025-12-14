-- RESOLUTION ENGINE: King of the Pot

-- 1. Add 'winning_outcome' to markets table if not exists
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS winning_outcome text;

-- 2. Create the Resolution Function
CREATE OR REPLACE FUNCTION resolve_market(
    p_market_id text,
    p_winning_outcome text
) RETURNS jsonb AS $$
DECLARE
    v_total_pool numeric;
    v_total_winning_shares numeric;
    v_net_pool numeric;
    v_share_value numeric;
    v_position RECORD;
    v_distributed_amount numeric := 0;
BEGIN
    -- Check if market exists
    IF NOT EXISTS (SELECT 1 FROM markets WHERE id = p_market_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Market not found');
    END IF;

    -- 1. Get Total Pool (Home + Away)
    SELECT (COALESCE(total_pool_home, 0) + COALESCE(total_pool_away, 0)) INTO v_total_pool
    FROM markets WHERE id = p_market_id;

    IF v_total_pool IS NULL OR v_total_pool = 0 THEN
        UPDATE markets SET status = 'resolved', winning_outcome = p_winning_outcome WHERE id = p_market_id;
        RETURN jsonb_build_object('success', true, 'message', 'Market resolved (No pool)');
    END IF;

    -- 2. Deduct 10% Admin Fee
    -- Net Pool = Total * 0.90
    v_net_pool := v_total_pool * 0.90;

    -- HANDLE DRAW (Refund - Fee)
    IF p_winning_outcome = 'draw' THEN
        FOR v_position IN 
            SELECT user_id, shares, avg_price 
            FROM positions 
            WHERE market_id = p_market_id
        LOOP
            -- Calculate Refund: (Shares * AvgPrice) * 0.90
            -- This approximates the original investment minus 10%
            UPDATE profiles 
            SET balance = balance + ((v_position.shares * v_position.avg_price) * 0.90)
            WHERE id = v_position.user_id;
        END LOOP;

        UPDATE markets SET status = 'resolved', winning_outcome = 'draw' WHERE id = p_market_id;
        UPDATE orders SET status = 'refunded' WHERE market_id = p_market_id;

        RETURN jsonb_build_object('success', true, 'message', 'Empate! Valores reembolsados com taxa de 10%.');
    END IF;

    -- 3. Get Total Winning Shares (How many shares exist for the winner?)
    SELECT COALESCE(SUM(shares), 0) INTO v_total_winning_shares
    FROM positions
    WHERE market_id = p_market_id AND outcome = p_winning_outcome;

    IF v_total_winning_shares = 0 THEN
        -- No one won. Market closes, House keeps pot (or refund logic could go here).
        UPDATE markets SET status = 'resolved', winning_outcome = p_winning_outcome WHERE id = p_market_id;
        RETURN jsonb_build_object('success', true, 'message', 'No winners. Pool retained by House.');
    END IF;

    -- 4. Calculate Value Per Share
    -- Ensure we don't divide by zero (handled by IF above, but safety first)
    v_share_value := v_net_pool / v_total_winning_shares;

    -- 5. Distribute Winnings to each holder
    FOR v_position IN 
        SELECT user_id, shares 
        FROM positions 
        WHERE market_id = p_market_id AND outcome = p_winning_outcome
    LOOP
        -- Credit User
        UPDATE profiles 
        SET balance = balance + (v_position.shares * v_share_value)
        WHERE id = v_position.user_id;
        
        v_distributed_amount := v_distributed_amount + (v_position.shares * v_share_value);
    END LOOP;

    -- 6. Close Market
    UPDATE markets 
    SET status = 'resolved', 
        winning_outcome = p_winning_outcome 
    WHERE id = p_market_id;

    -- 7. Update Orders/Positions for record keeping (Optional but good UX)
    UPDATE orders SET status = 'won' WHERE market_id = p_market_id AND outcome = p_winning_outcome;
    UPDATE orders SET status = 'lost' WHERE market_id = p_market_id AND outcome != p_winning_outcome;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Market Resolved Successfully', 
        'share_value', v_share_value,
        'total_distributed', v_distributed_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
