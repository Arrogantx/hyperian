import { createClient } from '@supabase/supabase-js';

// Runtime check to ensure env vars are defined
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { wallet } = req.body;

  const { data: multiplierData } = await supabase
    .from("nft_multiplier")
    .select("*")
    .eq("wallet_address", wallet)
    .single();

  const multiplier = multiplierData?.multiplier || 1.0;
  const basePoints = 10;
  const points = basePoints * multiplier;

  await supabase
  .from("user_points")
  .upsert({
    wallet_address: wallet,
    total_points: points,
    weekly_points: points,
    last_claimed_at: new Date()
  }, { onConflict: 'wallet_address' });


  return res.status(200).json({ success: true, points });
}
