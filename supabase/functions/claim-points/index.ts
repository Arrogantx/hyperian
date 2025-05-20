import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔧 CORS-compliant response wrapper
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Or use "https://hyperianmovement.xyz"
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  // ✅ Enforce Authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ success: false, error: "Missing or invalid authorization header" }, 401);
  }

  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return jsonResponse({ success: false, error: "Missing wallet address" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    // ✅ Fetch multiplier
    const { data: multiplierData, error: multiplierError } = await supabase
      .from("nft_multiplier")
      .select("multiplier")
      .eq("wallet_address", wallet)
      .single();

    if (multiplierError) {
      console.error("Multiplier fetch error:", multiplierError);
    }

    const multiplier = multiplierData?.multiplier || 1.0;
    const points = 10 * multiplier;

    // ✅ Update user_points
    const { error: upsertError } = await supabase.from("user_points").upsert(
      {
        address: wallet,
        total_points: points,
        weekly_points: points,
        last_claimed_at: new Date().toISOString(),
      },
      { onConflict: "address" }
    );

    if (upsertError) {
      return jsonResponse({ success: false, error: upsertError.message }, 500);
    }

    // ✅ Fetch updated totals
    const { data: updatedUser, error: fetchError } = await supabase
      .from("user_points")
      .select("total_points, weekly_points, last_claimed_at")
      .eq("address", wallet)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return jsonResponse({ success: false, error: fetchError.message }, 500);
    }

    // ✅ Calculate next claim time (6 hours)
    const nextClaimAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    return jsonResponse({
      success: true,
      points,
      total_points: updatedUser?.total_points ?? 0,
      weekly_points: updatedUser?.weekly_points ?? 0,
      next_claim_at: nextClaimAt,
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ success: false, error: "Invalid request or internal error" }, 500);
  }
});
