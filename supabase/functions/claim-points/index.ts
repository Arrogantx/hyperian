// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const HYPERIANS_CONTRACT = "0x4414C32982b4CF348d4FDC7b86be2Ef9b1ae1160";
const GENESIS_CONTRACT = "0xB0F82655F249FC6561A94eB370d41bD24A861A9d";
const RPC_URL = "https://rpc.hyperliquid.xyz/evm";
const COOLDOWN_MS = 5 * 60 * 60 * 1000;

function encodeBalanceOf(address: string): string {
  return `0x70a08231${address.toLowerCase().replace("0x", "").padStart(64, "0")}`;
}

async function getBalance(wallet: string, contract: string): Promise<number> {
  const payload = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [{ to: contract, data: encodeBalanceOf(wallet) }, "latest"],
    id: 1,
  };

  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.result) throw new Error("Failed to fetch balance");
  return parseInt(json.result, 16);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

serve(async (req) => {
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

  const PROJECT_URL = Deno.env.get("PROJECT_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

  if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase environment variables.");
    return jsonResponse({ success: false, error: "Server misconfiguration" }, 500);
  }

  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const wallet = body?.wallet?.toLowerCase();

    if (!wallet) {
      console.warn("No wallet provided");
      return jsonResponse({ success: false, error: "Missing wallet address" }, 400);
    }

    console.log("Claim request from wallet:", wallet);

    const now = new Date();

    const { data: user, error: userError } = await supabase
      .from("user_points")
      .select("*")
      .eq("address", wallet)
      .maybeSingle();

    if (userError) {
      console.error("Supabase query error:", userError.message);
      return jsonResponse({ success: false, error: userError.message }, 500);
    }

    const lastClaim = user?.last_claimed_at ? new Date(user.last_claimed_at) : null;
    const canClaim = !lastClaim || now.getTime() - lastClaim.getTime() >= COOLDOWN_MS;

    if (!canClaim) {
      const nextClaimAt = new Date(lastClaim.getTime() + COOLDOWN_MS).toISOString();
      return jsonResponse({ success: false, error: "Cooldown active", next_claim_at: nextClaimAt }, 429);
    }

    const [hyperiansHeld, genesisHeld] = await Promise.all([
      getBalance(wallet, HYPERIANS_CONTRACT),
      getBalance(wallet, GENESIS_CONTRACT),
    ]);

    const totalHeld = hyperiansHeld + genesisHeld;
    const basePoints = hyperiansHeld * 5 + genesisHeld * 3;

    const tierMultiplier =
      totalHeld >= 25 ? 3 :
      totalHeld >= 10 ? 2 :
      totalHeld >= 5 ? 1.5 : 1;

    const rewardPoints = Math.floor(basePoints * tierMultiplier);

    const parsedTotalClaimed =
      typeof user?.total_claimed === "number"
        ? user.total_claimed
        : parseFloat(user?.total_claimed || "0");

    const updatedTotal = (user?.total_points || 0) + rewardPoints;
    const updatedWeekly = (user?.weekly_points || 0) + rewardPoints;
    const updatedClaimed = parsedTotalClaimed + rewardPoints;

    const { error: updateError } = await supabase
      .from("user_points")
      .update({
        total_points: updatedTotal,
        weekly_points: updatedWeekly,
        total_claimed: updatedClaimed,
        last_claimed_at: now.toISOString(),
        total_nfts_held: totalHeld,
        activity_multiplier: tierMultiplier,
      })
      .eq("address", wallet);

    if (updateError) {
      console.error("Supabase update error:", updateError.message);
      return jsonResponse({ success: false, error: updateError.message }, 500);
    }

    const nextClaimAt = new Date(now.getTime() + COOLDOWN_MS).toISOString();

    return jsonResponse({
      success: true,
      points: rewardPoints,
      available_points: rewardPoints,
      total_points: updatedTotal,
      weekly_points: updatedWeekly,
      total_claimed: updatedClaimed,
      next_claim_at: nextClaimAt,
      tier_multiplier: tierMultiplier,
      hyperiansHeld,
      genesisHeld,
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ success: false, error: err?.message || "Unknown error" }, 500);
  }
});
