-- 1. Add XP column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp numeric DEFAULT 0;

-- 2. Create Trigger Function to award XP
CREATE OR REPLACE FUNCTION award_xp_on_win()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award XP for 'payout' (Standard Bet Win) or 'challenge_payout' (P2P Win)
    -- We assume 1 Real = 1 XP.
    -- We use ABS to be safe, though payouts should be positive.
    
    IF NEW.type IN ('payout', 'challenge_payout') THEN
        UPDATE profiles
        SET xp = xp + ABS(NEW.amount)
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_gamification_xp ON transactions;

CREATE TRIGGER trg_gamification_xp
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_win();

-- 4. Backfill (Optional: Award XP for past wins if any exist)
-- UPDATE profiles 
-- SET xp = (
--    SELECT COALESCE(SUM(amount), 0) 
--    FROM transactions 
--    WHERE user_id = profiles.id AND type IN ('payout', 'challenge_payout')
-- );
