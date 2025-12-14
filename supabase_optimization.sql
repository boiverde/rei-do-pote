-- OPTIMIZATION: Performance Indices

-- 1. Index for Market Resolution Query
-- We frequently query by status and event_date to find "Past Due" markets.
CREATE INDEX IF NOT EXISTS idx_markets_status_date 
ON markets (status, event_date);

-- 2. Index for filtering by League (Frontend Grid)
CREATE INDEX IF NOT EXISTS idx_markets_league 
ON markets (league);

-- 3. Index for user positions (My Bets)
-- We frequently query positions by user_id
CREATE INDEX IF NOT EXISTS idx_positions_user_id 
ON positions (user_id);

-- 4. Index for Orders by User
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON orders (user_id);
