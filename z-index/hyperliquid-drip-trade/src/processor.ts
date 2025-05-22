// src/processor.ts

import 'reflect-metadata';
import { EvmBatchProcessor } from '@subsquid/evm-processor';
import { Store }            from '@subsquid/typeorm-store';

import { ItemSold }      from './model/itemSold';
import { BidAccepted }   from './model/bidAccepted';
import { Ownership }     from './model/ownership';

import { handleItemSold }    from './handlers/drip-trade';
import { handleBidAccepted } from './handlers/bid-accepted';
import { handleTransfer }    from './handlers/transfer';

// — your two NFT contracts —
const HYPERIANS_CONTRACT = '0x4414C32982b4CF348d4FDC7b86be2Ef9b1ae1160';
const GENESIS_CONTRACT   = '0xB0F82655F249FC6561A94eB370d41bD24A861A9d';

// — Drip.trade contract & event signatures —
const DRIP_TRADE_CONTRACT = '0xYourDripTradeContractAddress';  
// keccak256("Transfer(address,address,uint256)")
const TRANSFER_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

EvmBatchProcessor.run(
  new EvmBatchProcessor()
    .setDataSource({
      archive: 'https://v2.archive.subsquid.io/network/hyperliquid-mainnet',
      chain: {
        id:      999,
        name:    'HyperEVM Mainnet',
        network: 'hyperliquid',
        rpc:     ['https://rpc.hyperliquid.xyz/evm']
      }
    })

    // 1) Track ERC-721 transfers on your two NFT contracts
    .addLog(
      {
        address: [ HYPERIANS_CONTRACT, GENESIS_CONTRACT ],
        topic0:  [ TRANSFER_SIG ]
      },
      handleTransfer
    )

    // 2) Index Drip.trade marketplace events
    .addTransaction(
      { address: DRIP_TRADE_CONTRACT, method: 'itemSold'    },
      handleItemSold
    )
    .addTransaction(
      { address: DRIP_TRADE_CONTRACT, method: 'bidAccepted' },
      handleBidAccepted
    )

    // 3) Register your entities
    .addEntity(ItemSold)
    .addEntity(BidAccepted)
    .addEntity(Ownership)

    // 4) Use the TypeORM-based Store
    .setStore(new Store({ projectDir: __dirname }))
    .build()
);
