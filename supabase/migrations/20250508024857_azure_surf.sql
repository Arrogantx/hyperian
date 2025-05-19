/*
  # Whitelist Table Setup with RLS Policies

  1. New Tables
    - `whitelist`
      - `id` (uuid, primary key)
      - `address` (text, unique)
      - `status` (text, check constraint: 'standard' or 'freemint')
      - `added_by` (text)
      - `ens_name` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on whitelist table
    - Public read-only access for whitelist status checks
    - Admin-only access for all operations
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
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'whitelist' 
    AND policyname = 'Anyone can check whitelist status'
  ) THEN
    DROP POLICY "Anyone can check whitelist status" ON whitelist;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'whitelist' 
    AND policyname = 'Admins can manage whitelist'
  ) THEN
    DROP POLICY "Admins can manage whitelist" ON whitelist;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Anyone can check whitelist status"
  ON whitelist
  FOR SELECT
  TO public
  USING (true);

-- Admin policy using wallet addresses instead of email
CREATE POLICY "Admins can manage whitelist"
  ON whitelist
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'sub' IN (
      '0xd8E00074E43A343bfEdf5981ac00dC038A8520f0',
      '0xE6a531199EC3d0C984CBcffa44f2Dd0E685CC71e'
    )
  );