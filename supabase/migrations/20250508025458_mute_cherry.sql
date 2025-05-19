/*
  # Fix whitelist table and policies

  1. Changes
    - Update RLS policies to use wallet addresses for authentication
    - Add proper error handling for policy checks
    - Ensure unique constraints are properly enforced

  2. Security
    - Enable RLS on whitelist table
    - Allow public read access for whitelist status checks
    - Restrict write access to admin wallets only
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('standard', 'freemint')),
  added_by text NOT NULL,
  ens_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can check whitelist status" ON whitelist;
  DROP POLICY IF EXISTS "Admins can manage whitelist" ON whitelist;
END $$;

-- Public can check whitelist status
CREATE POLICY "Anyone can check whitelist status"
  ON whitelist
  FOR SELECT
  TO public
  USING (true);

-- Admin policy using wallet addresses
CREATE POLICY "Admins can manage whitelist"
  ON whitelist
  FOR ALL
  TO authenticated
  USING (
    lower(auth.jwt() ->> 'sub') IN (
      lower('0xd8E00074E43A343bfEdf5981ac00dC038A8520f0'),
      lower('0xE6a531199EC3d0C984CBcffa44f2Dd0E685CC71e')
    )
  );