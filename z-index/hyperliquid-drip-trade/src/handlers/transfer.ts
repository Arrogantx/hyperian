// src/handlers/transfer.ts

import { 
    LogHandlerContext, 
    Log 
  } from '@subsquid/evm-processor';
  import { TypeormStore } from '@subsquid/typeorm-store';
  import { Ownership } from '../model/ownership';
  
  // keccak256("Transfer(address,address,uint256)")
  const TRANSFER_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  
  export async function handleTransfer(
    ctx: LogHandlerContext<TypeormStore>,
    log: Log<any>
  ) {
    // only ERC-721 Transfer events
    if (log.topics[0] !== TRANSFER_SIG) return;
  
    const from    = '0x' + log.topics[1].slice(-40);
    const to      = '0x' + log.topics[2].slice(-40);
    const tokenId = BigInt(log.topics[3]).toString();
  
    // remove the old row (skip mints)
    if (from !== '0x0000000000000000000000000000000000000000') {
      const prevId = `${log.address}-${tokenId}-${from}`;
      await ctx.store.remove(Ownership, prevId);
    }
  
    // insert the new owner row
    const ownership = new Ownership();
    ownership.id       = `${log.address}-${tokenId}-${to}`;
    ownership.owner    = to;
    ownership.contract = log.address;
    ownership.tokenId  = tokenId;
  
    await ctx.store.insert(ownership);
  }
  