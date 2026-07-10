import { ParsedTransactionWithMeta } from '@solana/web3.js';

export interface PumpCreateEvent {
  mint: string;
  creator: string;
  timestamp: number;
}

export interface PumpTradeEvent {
  mint: string;
  trader: string;
  side: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  slot: number;
  signature: string;
  timestamp: number;
}

export const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

export function parsePumpTransaction(tx: any): { type: 'create' | 'trade' | null; data: any } {
  if (!tx || !tx.transaction || !tx.meta) {
    return { type: null, data: null };
  }

  const logs: string[] = tx.meta.logMessages || [];
  const signature = tx.transaction.signatures?.[0] || '';
  const slot = tx.slot || 0;
  const timestamp = tx.blockTime || Math.floor(Date.now() / 1000);

  // Check if it relates to Pump.fun
  const isPumpTx = tx.transaction.message.accountKeys.some(
    (key: any) => (typeof key === 'string' ? key : key.pubkey?.toString()) === PUMP_PROGRAM_ID
  );

  if (!isPumpTx) {
    return { type: null, data: null };
  }

  // Check logs for instruction types
  const hasCreate = logs.some(log => log.includes('Instruction: Create'));
  const hasBuy = logs.some(log => log.includes('Instruction: Buy'));
  const hasSell = logs.some(log => log.includes('Instruction: Sell'));

  if (hasCreate) {
    // Creator is the first signer
    const creator = tx.transaction.message.accountKeys[0]?.toString() || '';
    // Mint is usually the first account passed to create instruction
    const mint = tx.transaction.message.accountKeys[1]?.toString() || '';

    return {
      type: 'create',
      data: {
        mint,
        creator,
        timestamp,
      } as PumpCreateEvent,
    };
  }

  if (hasBuy || hasSell) {
    const trader = tx.transaction.message.accountKeys[0]?.toString() || '';
    // Mint is usually the first account or from outer logs
    const mint = tx.transaction.message.accountKeys[2]?.toString() || '';
    const side = hasBuy ? 'buy' : 'sell';

    // In a production env, you would parse the transaction innerInstructions or tokenBalances
    // to extract the exact SOL and token amounts.
    // For MVP rule computations, we extract from preBalances / postBalances.
    const preBalances = tx.meta.preBalances || [];
    const postBalances = tx.meta.postBalances || [];
    // Trader balance change in lamports
    const balanceChange = (preBalances[0] || 0) - (postBalances[0] || 0);
    const solAmount = Math.abs(balanceChange) / 1e9; // convert to SOL

    // Mock token amount if not fully parsed from tokenBalances
    const tokenAmount = 1000000; 

    return {
      type: 'trade',
      data: {
        mint,
        trader,
        side,
        solAmount,
        tokenAmount,
        slot,
        signature,
        timestamp,
      } as PumpTradeEvent,
    };
  }

  return { type: null, data: null };
}
