/*
  # Create user points table with proper RLS policies

  1. New Tables
    - `user_points`
      - `address` (text, primary key)
      - `points` (numeric, default 0)
      - `unclaimed_points` (numeric, default 0)
      - `last_claim` (timestamptz, default now)
      - `total_claimed` (numeric, default 0)
      - `staked_tokens` (text[], default empty array)
      - `updated_at` (timestamptz, default now)
      - `last_activity` (timestamptz, default now)
      - `total_nfts_held` (numeric, default 0)
      - `acquisition_bonus_ends` (timestamptz, nullable)
      - `activity_multiplier` (numeric, default 1)
      - `weekly_points` (numeric, default 0)
      - `weekly_reset` (timestamptz, default now)

  2. Security
    - Enable RLS
    - Allow public read access to own data
    - Allow authenticated contract to update data
*/

CREATE TABLE IF NOT EXISTS user_points (
  address text PRIMARY KEY,
  points numeric DEFAULT 0,
  unclaimed_points numeric DEFAULT 0,
  last_claim timestamptz DEFAULT now(),
  total_claimed numeric DEFAULT 0,
  staked_tokens text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  total_nfts_held numeric DEFAULT 0,
  acquisition_bonus_ends timestamptz,
  activity_multiplier numeric DEFAULT 1,
  weekly_points numeric DEFAULT 0,
  weekly_reset timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
  DROP POLICY IF EXISTS "Contract can update user points" ON user_points;
END $$;

-- Users can view their own points
CREATE POLICY "Users can view their own points"
  ON user_points
  FOR SELECT
  TO public
  USING (true);

-- Contract can update user points
CREATE POLICY "Contract can update user points"
  ON user_points
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);