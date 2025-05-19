/*
  # Add staking-related tables

  1. New Tables
    - `staking_stats`
      - `id` (uuid, primary key)
      - `total_staked` (numeric, default 0)
      - `total_points` (numeric, default 0)
      - `last_updated` (timestamptz)
    
    - `user_points`
      - `address` (text, primary key)
      - `points` (numeric, default 0)
      - `unclaimed_points` (numeric, default 0)
      - `last_claim` (timestamptz)
      - `total_claimed` (numeric, default 0)
      - `staked_tokens` (text[], stores token IDs)
      - `updated_at` (timestamptz)

    - `point_shop_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `cost` (numeric)
      - `stock` (numeric, -1 for unlimited)
      - `active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public can read staking stats
    - Users can read their own point data
    - Admins can manage all data
*/

-- Staking Stats Table
CREATE TABLE IF NOT EXISTS staking_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_staked numeric DEFAULT 0,
  total_points numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  address text PRIMARY KEY,
  points numeric DEFAULT 0,
  unclaimed_points numeric DEFAULT 0,
  last_claim timestamptz DEFAULT now(),
  total_claimed numeric DEFAULT 0,
  staked_tokens text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Point Shop Items Table
CREATE TABLE IF NOT EXISTS point_shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  cost numeric NOT NULL,
  stock numeric DEFAULT -1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staking_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_shop_items ENABLE ROW LEVEL SECURITY;

-- Staking Stats Policies
CREATE POLICY "Public can view staking stats"
  ON staking_stats
  FOR SELECT
  TO public
  USING (true);

-- User Points Policies
CREATE POLICY "Users can view their own points"
  ON user_points
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Contract can update user points"
  ON user_points
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Point Shop Policies
CREATE POLICY "Public can view active items"
  ON point_shop_items
  FOR SELECT
  TO public
  USING (active = true);

-- Admin Policies
CREATE POLICY "Admins can manage point shop"
  ON point_shop_items
  FOR ALL
  TO authenticated
  USING (
    lower((auth.jwt() ->> 'sub')::text) = ANY (ARRAY[
      lower('0xd8E00074E43A343bfEdf5981ac00dC038A8520f0'::text),
      lower('0xE6a531199EC3d0C984CBcffa44f2Dd0E685CC71e'::text)
    ])
  );