/*
  # Fix Whitelist RLS Policies

  1. Changes
    - Add policy for public inserts
    - Fix case-sensitive address comparison in admin policy
    - Add index for case-insensitive address lookups

  2. Security
    - Enable RLS on whitelist table
    - Allow public SELECT for status checking
    - Allow public INSERT for self-registration
    - Allow admin management for specific wallet addresses
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

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS whitelist_address_idx ON whitelist (lower(address));

-- Enable RLS
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can check whitelist status" ON whitelist;
  DROP POLICY IF EXISTS "Admins can manage whitelist" ON whitelist;
  DROP POLICY IF EXISTS "Anyone can add to whitelist" ON whitelist;
END $$;

-- Public can check whitelist status
CREATE POLICY "Anyone can check whitelist status"
  ON whitelist
  FOR SELECT
  TO public
  USING (true);

-- Allow public to insert new entries
CREATE POLICY "Anyone can add to whitelist"
  ON whitelist
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin policy using wallet addresses with case-insensitive comparison
CREATE POLICY "Admins can manage whitelist"
  ON whitelist
  FOR ALL
  TO authenticated
  USING (
    lower((auth.jwt() ->> 'sub')::text) = ANY (ARRAY[
      lower('0xd8E00074E43A343bfEdf5981ac00dC038A8520f0'::text),
      lower('0xE6a531199EC3d0C984CBcffa44f2Dd0E685CC71e'::text)
    ])
  );