import { ethers } from 'ethers';
import type { Log } from 'ethers'; // ✅ Ethers v6 Log type

// --- Configuration ---
const RPC_URLS = [
  'https://rpc.hyperliquid.xyz/evm',
  'https://999.rpc.thirdweb.com/',
];

const HYPERIANS_CONTRACT = '0x4414C32982b4CF348d4FDC7b86be2Ef9b1ae1160';
const GENESIS_CONTRACT = '0xB0F82655F249FC348d4FDC7b86be2Ef9b1ae1160';
const CONTRACTS = [HYPERIANS_CONTRACT, GENESIS_CONTRACT];

const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
const BLOCK_SPAN_LIMIT = 1000;

// One provider per RPC
const providers = RPC_URLS.map(url => new ethers.JsonRpcProvider(url));

/**
 * Scans batched Transfer logs across contracts and returns held token IDs.
 */
export async function fetchNFTs(
  owner: string,
  startBlock: number = 0,
  endBlock: number | 'latest' = 'latest'
): Promise<{ contract: string; tokenIds: string[] }[]> {
  const checksum = ethers.getAddress(owner);
  const ownerTopic = '0x' + checksum.slice(2).toLowerCase().padStart(64, '0');
  const holdings = new Map<string, Set<string>>();

  for (const provider of providers) {
    let latestBlock: number;
    try {
      latestBlock = endBlock === 'latest' ? Number(await provider.getBlockNumber()) : endBlock;
    } catch (err) {
      console.error('Failed to fetch latest block:', err);
      continue;
    }

    const safeStartBlock = startBlock === 0 ? Math.max(0, latestBlock - 50000) : startBlock;

    for (const contract of CONTRACTS) {
      for (let from = safeStartBlock; from <= latestBlock; from += BLOCK_SPAN_LIMIT) {
        const to = Math.min(from + BLOCK_SPAN_LIMIT - 1, latestBlock);

        const recvFilter = {
          address: contract,
          fromBlock: from,
          toBlock: to,
          topics: [TRANSFER_TOPIC, null, ownerTopic],
        };

        const sentFilter = {
          address: contract,
          fromBlock: from,
          toBlock: to,
          topics: [TRANSFER_TOPIC, ownerTopic],
        };

        let recvLogs: Log[] = [];
        let sentLogs: Log[] = [];

        try {
          [recvLogs, sentLogs] = await Promise.all([
            provider.getLogs(recvFilter),
            provider.getLogs(sentFilter),
          ]);
        } catch (err) {
          console.warn(`Error fetching logs from ${from} to ${to} for contract ${contract}`, err);
          continue;
        }

        for (const log of recvLogs) {
          const tokenId = BigInt(log.topics[3]).toString();
          if (!holdings.has(contract)) holdings.set(contract, new Set());
          holdings.get(contract)!.add(tokenId);
        }

        for (const log of sentLogs) {
          const tokenId = BigInt(log.topics[3]).toString();
          const set = holdings.get(contract);
          if (set) {
            set.delete(tokenId);
            if (set.size === 0) holdings.delete(contract);
          }
        }
      }
    }
  }

  return Array.from(holdings.entries()).map(([contract, tokens]) => ({
    contract,
    tokenIds: Array.from(tokens),
  }));
}
