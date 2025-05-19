/*
  # Create whitelist table with policies

  1. New Tables
    - `whitelist`
      - `id` (uuid, primary key)
      - `address` (text, unique)
      - `status` (text, check constraint for 'standard' or 'freemint')
      - `added_by` (text)
      - `ens_name` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `whitelist` table
    - Add policy for public to read whitelist status
    - Add policy for admins to manage whitelist
*/

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

-- Only admins can manage whitelist
CREATE POLICY "Admins can manage whitelist"
  ON whitelist
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = ANY (ARRAY['admin1@example.com'::text, 'admin2@example.com'::text]));