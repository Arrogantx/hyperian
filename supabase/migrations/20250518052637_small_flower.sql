/*
  # Update Points System Schema

  1. Changes
    - Add fields for tracking user engagement and rewards
    - Update point calculation logic
    - Add activity tracking

  2. Security
    - Maintain existing RLS policies
    - Add new policies for activity tracking
*/

-- Add new columns to user_points table
ALTER TABLE user_points
ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS total_nfts_held numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS acquisition_bonus_ends timestamptz,
ADD COLUMN IF NOT EXISTS activity_multiplier numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS weekly_points numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_reset timestamptz DEFAULT now();

-- Create activity tracking table
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL REFERENCES user_points(address),
  activity_type text NOT NULL,
  points_earned numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create point rules table
CREATE TABLE IF NOT EXISTS point_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  points numeric NOT NULL,
  cooldown_seconds numeric DEFAULT 0,
  max_daily numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;

-- Activity tracking policies
CREATE POLICY "Users can view their own activity"
  ON user_activity
  FOR SELECT
  TO public
  USING (address = auth.jwt() ->> 'sub');

CREATE POLICY "System can insert activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Point rules policies
CREATE POLICY "Anyone can view active rules"
  ON point_rules
  FOR SELECT
  TO public
  USING (active = true);

-- Insert default point rules
INSERT INTO point_rules (name, points, cooldown_seconds, max_daily) VALUES
('holding_reward', 10, 18000, 0),         -- 10 points per NFT per 5 hours
('acquisition_bonus', 50, 0, 0),          -- 50 points for new NFT acquisition
('mint_bonus', 100, 0, 0),                -- 100 points for minting
('trade_penalty', -10, 0, 0),             -- -10 points for selling (optional)
('referral_bonus', 150, 0, 1),            -- 150 points for referring (once per day)
('challenge_completion', 25, 0, 3);        -- 25 points per challenge (max 3 per day)

-- Create function to calculate points
CREATE OR REPLACE FUNCTION calculate_user_points(
  p_address text,
  p_action text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS numeric AS $$
DECLARE
  v_points numeric;
  v_rule point_rules%ROWTYPE;
  v_last_activity timestamptz;
  v_daily_count numeric;
BEGIN
  -- Get the rule
  SELECT * INTO v_rule
  FROM point_rules
  WHERE name = p_action AND active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Check cooldown
  SELECT last_activity INTO v_last_activity
  FROM user_activity
  WHERE address = p_address AND activity_type = p_action
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_activity IS NOT NULL AND 
     v_rule.cooldown_seconds > 0 AND
     (EXTRACT(EPOCH FROM (now() - v_last_activity)) < v_rule.cooldown_seconds) THEN
    RETURN 0;
  END IF;

  -- Check daily limit
  IF v_rule.max_daily > 0 THEN
    SELECT COUNT(*) INTO v_daily_count
    FROM user_activity
    WHERE address = p_address 
      AND activity_type = p_action
      AND created_at > date_trunc('day', now());

    IF v_daily_count >= v_rule.max_daily THEN
      RETURN 0;
    END IF;
  END IF;

  -- Calculate points
  v_points := v_rule.points;

  -- Apply multipliers from metadata if any
  IF p_metadata ? 'multiplier' THEN
    v_points := v_points * (p_metadata->>'multiplier')::numeric;
  END IF;

  RETURN v_points;
END;
$$ LANGUAGE plpgsql;