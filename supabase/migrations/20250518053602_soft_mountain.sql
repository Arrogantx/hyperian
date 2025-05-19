/*
  # Fix RLS policies and add missing columns

  1. Changes
    - Update RLS policies to allow proper access
    - Add missing columns for points tracking
    - Fix user_points table structure

  2. Security
    - Enable RLS
    - Allow public read access
    - Allow authenticated write access
*/

-- Ensure user_points table exists with all required columns
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

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
  DROP POLICY IF EXISTS "Contract can update user points" ON user_points;
END $$;

-- Allow public to read all records (needed for leaderboard)
CREATE POLICY "Anyone can view points"
  ON user_points
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert/update records
CREATE POLICY "Authenticated users can manage points"
  ON user_points
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_points_address_idx ON user_points (lower(address));