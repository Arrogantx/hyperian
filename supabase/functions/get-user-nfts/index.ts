// functions/get-user-nfts.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GRAPHQL_URL = "https://api.hyperscan.com/graphql";
const HYPERIANS_ADDRESS = '0x8fB5a7894AB461a59ACdfab8918335768e411414';
const GENESIS_ADDRESS = '0x7AfEdA6584e7D4A6E6F0B241A24B8b568493776D';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let wallet: string;
try {
  const payload = await req.json();
  // accept either "wallet" or "address" field
  const w = (payload.wallet ?? payload.address) as string;
  if (!w || !/^0x[a-fA-F0-9]{40}$/.test(w)) throw new Error();
  wallet = w.toLowerCase();
} catch {
  return new Response(
    JSON.stringify({ error: "Invalid wallet" }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}


  // GraphQL query: fetch balances + token IDs + metadata in one go
  const query = /* GraphQL */ `
    query getUserNFTs($owner: String!, $contracts: [String!]!) {
      tokenBalances(
        input: { owner: $owner, tokens: $contracts }
      ) {
        items {
          tokenAddress
          tokenId
          metadata {
            name
            image {
              url
            }
          }
        }
      }
    }
  `;

  const variables = {
    owner: wallet,
    contracts: [HYPERIANS_ADDRESS, GENESIS_ADDRESS],
  };

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // If Hyperscan requires an API key, include it:
        // "x-api-key": Deno.env.get("HYPERSCAN_API_KEY")!,
      },
      body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await res.json();
    if (errors || !data) {
      console.error("Hyperscan GraphQL error:", errors);
      throw new Error("Failed to fetch NFTs");
    }

    const items = data.tokenBalances.items;
    const hyperianIds = items
      .filter((i: any) => i.tokenAddress.toLowerCase() === HYPERIANS_ADDRESS.toLowerCase())
      .map((i: any) => ({
        tokenId: i.tokenId,
        metadata: i.metadata,
      }));
    const genesisIds = items
      .filter((i: any) => i.tokenAddress.toLowerCase() === GENESIS_ADDRESS.toLowerCase())
      .map((i: any) => ({
        tokenId: i.tokenId,
        metadata: i.metadata,
      }));

    return new Response(
      JSON.stringify({
        success: true,
        hyperian: hyperianIds,
        genesis: genesisIds,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("🔥 get-user-nfts error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
