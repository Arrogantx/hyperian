// File: supabase/functions/get-user-nfts/index.ts (Trace-safe eth_call with debug logs)

import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("✅ Edge Function loaded and parsing request...");

const HYPERIANS_CONTRACT = "0x4414C32982b4CF348d4FDC7b86be2Ef9b1ae1160";
const GENESIS_CONTRACT = "0xB0F82655F249FC6561A94eB370d41bD24A861A9d";
const RPC_URL = "https://rpc.hyperliquid.xyz/evm";

function encodeBalanceOf(address: string): string {
  return `0x70a08231${address.toLowerCase().replace("0x", "").padStart(64, "0")}`;
}

function encodeTokenOfOwnerByIndex(address: string, index: number): string {
  const selector = "2f745c59";
  const owner = address.toLowerCase().replace("0x", "").padStart(64, "0");
  const idxHex = index.toString(16).padStart(64, "0");
  return `0x${selector}${owner}${idxHex}`;
}

async function ethCall(contract: string, data: string): Promise<string | null> {
  try {
    console.log(`📡 eth_call: ${contract} ${data}`);
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: contract, data }, "latest"],
        id: 1,
      }),
    });

    const json = await res.json();
    console.log("📥 eth_call response:", json);
    return json.result ?? null;
  } catch (err) {
    console.error("❌ ethCall failed:", err);
    return null;
  }
}

async function getTokenIds(address: string, contract: string): Promise<number[]> {
  const balanceHex = await ethCall(contract, encodeBalanceOf(address));
  if (!balanceHex) {
    console.error(`⚠️ Failed to get balance for ${contract}`);
    return [];
  }

  const balance = parseInt(balanceHex, 16);
  console.log(`🎯 ${contract} balance: ${balance}`);
  const ids: number[] = [];

  for (let i = 0; i < balance; i++) {
    const data = encodeTokenOfOwnerByIndex(address, i);
    const result = await ethCall(contract, data);
    if (result) {
      const tokenId = parseInt(result, 16);
      ids.push(tokenId);
      console.log(`✅ token[${i}]: ${tokenId}`);
    } else {
      console.warn(`⚠️ Failed to fetch tokenId at index ${i}`);
    }
  }
  return ids;
}

serve(async (req) => {
  try {
    console.log("🧪 req.json() parsing...");
    const { address } = await req.json();

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(JSON.stringify({ error: "Invalid address" }), { status: 400 });
    }

    console.log(`🚀 Fetching NFTs for: ${address}`);

    const [hyperians, genesis] = await Promise.all([
      getTokenIds(address, HYPERIANS_CONTRACT),
      getTokenIds(address, GENESIS_CONTRACT),
    ]);

    const purchases: string[] = [];

    return new Response(
      JSON.stringify({ hyperians, genesis, purchases }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔥 Function error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
