-- REFACTOR RANKING: Win-Only Score
-- Adds 'ranking_score' to profiles and updates resolution logic to track gross winnings.

-- 1. Add Column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ranking_score decimal DEFAULT 0.00;

-- 2. Update Resolution Logic (resolve_market)
DROP FUNCTION IF EXISTS public.resolve_market(text, text);

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
    v_winnings numeric;
BEGIN
    -- Check if market exists
    IF NOT EXISTS (SELECT 1 FROM markets WHERE id = p_market_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Market not found');
    END IF;

    -- 1. Get Total Pool
    SELECT (COALESCE(total_pool_home, 0) + COALESCE(total_pool_away, 0)) INTO v_total_pool
    FROM markets WHERE id = p_market_id;

    IF v_total_pool IS NULL OR v_total_pool = 0 THEN
        UPDATE markets SET status = 'resolved', winning_outcome = p_winning_outcome WHERE id = p_market_id;
        RETURN jsonb_build_object('success', true, 'message', 'Market resolved (No pool)');
    END IF;

    -- 2. Deduct 10% Admin Fee
    v_net_pool := v_total_pool * 0.90;

    -- HANDLE DRAW
    IF p_winning_outcome = 'draw' THEN
        FOR v_position IN 
            SELECT user_id, shares, avg_price 
            FROM positions 
            WHERE market_id = p_market_id
        LOOP
            v_winnings := (v_position.shares * v_position.avg_price) * 0.90;
            
            UPDATE profiles 
            SET balance = balance + v_winnings
            -- OPTIONAL: Do refunds count for ranking? Usually NO.
            WHERE id = v_position.user_id;
        END LOOP;

        UPDATE markets SET status = 'resolved', winning_outcome = 'draw' WHERE id = p_market_id;
        UPDATE orders SET status = 'refunded' WHERE market_id = p_market_id;

        RETURN jsonb_build_object('success', true, 'message', 'Empate! Reembolso efetuado.');
    END IF;

    -- 3. Get Total Winning Shares
    SELECT COALESCE(SUM(shares), 0) INTO v_total_winning_shares
    FROM positions
    WHERE market_id = p_market_id AND outcome = p_winning_outcome;

    IF v_total_winning_shares = 0 THEN
        UPDATE markets SET status = 'resolved', winning_outcome = p_winning_outcome WHERE id = p_market_id;
        RETURN jsonb_build_object('success', true, 'message', 'No winners. House keeps pot.');
    END IF;

    -- 4. Calculate Value Per Share
    v_share_value := v_net_pool / v_total_winning_shares;

    -- 5. Distribute Winnings
    FOR v_position IN 
        SELECT user_id, shares 
        FROM positions 
        WHERE market_id = p_market_id AND outcome = p_winning_outcome
    LOOP
        v_winnings := v_position.shares * v_share_value;

        -- Credit User Balance AND Ranking Score
        UPDATE profiles 
        SET balance = balance + v_winnings,
            ranking_score = ranking_score + v_winnings -- NEW: Add to Lifetime Score
        WHERE id = v_position.user_id;
        
        v_distributed_amount := v_distributed_amount + v_winnings;
    END LOOP;

    -- 6. Close Market
    UPDATE markets 
    SET status = 'resolved', 
        winning_outcome = p_winning_outcome 
    WHERE id = p_market_id;

    -- 7. Update Orders
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


-- 3. Update P2P Challenge Resolution Logic as well
DROP FUNCTION IF EXISTS public.resolve_challenge(uuid, text);

CREATE OR REPLACE FUNCTION resolve_challenge(
    p_challenge_id uuid,
    p_winning_outcome text
) RETURNS jsonb AS $$
DECLARE
    v_challenge RECORD;
    v_winner_id uuid;
    v_total_pot numeric;
    v_payout numeric;
BEGIN
    SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Challenge not found');
    END IF;

    IF v_challenge.status = 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already resolved');
    END IF;

    -- Determine Winner ID
    IF p_winning_outcome = v_challenge.creator_outcome THEN
        v_winner_id := v_challenge.creator_id;
    ELSIF p_winning_outcome = 'draw' THEN
        -- Refund Logic
        UPDATE profiles SET balance = balance + v_challenge.wager_amount WHERE id = v_challenge.creator_id;
        UPDATE profiles SET balance = balance + v_challenge.wager_amount WHERE id = v_challenge.opponent_id;
        UPDATE challenges SET status = 'resolved', winner_id = null WHERE id = p_challenge_id;
        RETURN jsonb_build_object('success', true, 'message', 'Draw. Refunded.');
    ELSE
        v_winner_id := v_challenge.opponent_id;
    END IF;

    -- Calculate Payout (No Fee for now? Or keep 10%?)
    -- Let's assume 10% fee for consistency standard
    v_total_pot := v_challenge.wager_amount * 2;
    v_payout := v_total_pot * 0.90; -- 10% Fee

    -- Pay Winner
    UPDATE profiles 
    SET balance = balance + v_payout,
        ranking_score = ranking_score + v_payout -- NEW: Add to Lifetime Score
    WHERE id = v_winner_id;

    UPDATE challenges 
    SET status = 'resolved', 
        winner_id = v_winner_id 
    WHERE id = p_challenge_id;

    RETURN jsonb_build_object('success', true, 'message', 'Challenge won by ' || v_winner_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
