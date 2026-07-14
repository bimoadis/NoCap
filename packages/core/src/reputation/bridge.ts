export interface BridgeTx {
  bridgeName: string;
  sourceChainId: string;
  sourceAddress: string;
  targetChainId: string;
  targetAddress: string;
  amount: string;
  timestamp: number;
}

export class BridgeTracker {
  // A mock registry of processed bridge transactions across chains
  private processedBridgeTransactions = new Map<string, BridgeTx>();

  constructor() {
    // Seed some mock bridge events
    // Across transfer: EVM (Ethereum) -> Solana target address
    this.registerBridgeTx('0xbridge_across_123', {
      bridgeName: 'Across',
      sourceChainId: '1', // Ethereum Mainnet
      sourceAddress: '0xevm_sender_address_abc123',
      targetChainId: 'solana',
      targetAddress: 'So11111111111111111111111111111111111111112',
      amount: '5000000000000000000', // 5 ETH
      timestamp: Date.now() - 600000
    });

    // Relay transfer: Robinhood Chain -> Base
    this.registerBridgeTx('0xbridge_relay_456', {
      bridgeName: 'Relay',
      sourceChainId: '4663', // Robinhood Chain
      sourceAddress: '0xrobinhood_deployer_999',
      targetChainId: '8453', // Base
      targetAddress: '0xbase_receiver_777',
      amount: '100000000000000000', // 0.1 ETH
      timestamp: Date.now() - 300000
    });
  }

  registerBridgeTx(txHash: string, tx: BridgeTx): void {
    this.processedBridgeTransactions.set(txHash, tx);
  }

  traceFundingSource(targetAddress: string, targetChainId: string): BridgeTx | undefined {
    // Find bridge txs where targetAddress and targetChainId match
    for (const tx of this.processedBridgeTransactions.values()) {
      if (
        tx.targetAddress.toLowerCase() === targetAddress.toLowerCase() &&
        tx.targetChainId === targetChainId
      ) {
        return tx;
      }
    }
    return undefined;
  }
}
