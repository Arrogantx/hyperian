// File: hyperliquid_nft_tracker.js

const { ethers } = require("ethers");
const fs = require("fs");

const RPC_URL = "https://rpc.hyperliquid.xyz/evm";
const provider = new ethers.JsonRpcProvider(RPC_URL);

const HYPERIANS_CONTRACT = "0x4414C32982b4CF348d4FDC7b86be2Ef9b1ae1160";
const GENESIS_CONTRACT = "0xB0F82655F249FC6561A94eB370d41bD24A861A9d";

const ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)"
];

async function getUserNFTs(userAddress, contractAddress) {
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  const transferFilter = contract.filters.Transfer(null, userAddress);

  const logs = await contract.queryFilter(transferFilter, 0, "latest");
  const ownedTokenIds = new Set();

  for (const log of logs) {
    const { from, to, tokenId } = log.args;
    try {
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        ownedTokenIds.add(tokenId.toString());
      }
    } catch {}
  }
  return Array.from(ownedTokenIds);
}

async function getAllUserNFTs(userAddress) {
  const hyperians = await getUserNFTs(userAddress, HYPERIANS_CONTRACT);
  const genesis = await getUserNFTs(userAddress, GENESIS_CONTRACT);
  return {
    hyperians,
    genesis,
  };
}

async function detectNewPurchases(userAddresses, fromBlock, toBlock) {
  const contracts = [HYPERIANS_CONTRACT, GENESIS_CONTRACT];
  const purchases = [];

  for (const contractAddress of contracts) {
    const contract = new ethers.Contract(contractAddress, ABI, provider);
    const filter = contract.filters.Transfer();
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);

    for (const log of logs) {
      const { from, to, tokenId } = log.args;
      if (
        from !== ethers.ZeroAddress &&
        userAddresses.includes(to.toLowerCase())
      ) {
        purchases.push({
          user: to,
          contract: contractAddress,
          tokenId: tokenId.toString(),
          blockNumber: log.blockNumber
        });
      }
    }
  }
  return purchases;
}

// Example usage
(async () => {
  const user = "0xYourUserWalletHere";
  const holdings = await getAllUserNFTs(user);
  console.log("Current Holdings:", holdings);

  const recentPurchases = await detectNewPurchases([user.toLowerCase()], 10000000, "latest");
  console.log("New Purchases:", recentPurchases);
})();
