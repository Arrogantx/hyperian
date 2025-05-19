/*
  # Create whitelist table
  
  1. New Tables
    - `whitelist`
      - `id` (uuid, primary key)
      - `address` (text, unique, not null) - The wallet address
      - `status` (text, not null) - Either 'standard' or 'freemint'
      - `added_by` (text, not null) - Who added this address
      - `ens_name` (text) - Optional ENS name
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on whitelist table
    - Add policies for:
      - Public can read whitelist entries
      - Only authenticated admins can insert/update/delete
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
  USING (
    auth.jwt() ->> 'email' IN (
      'admin1@example.com',
      'admin2@example.com'
    )
  );