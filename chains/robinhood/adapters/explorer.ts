import { ExplorerAdapter } from '../../../packages/core/src/adapters/ports.js';

export class BlockscoutExplorerAdapter implements ExplorerAdapter {
  chainId = '4663';
  private apiBase: string;

  constructor() {
    this.apiBase = process.env.BLOCKSCOUT_API_BASE_URL || 'https://explorer.robinhoodchain.com/api/v2';
  }

  async getTransactionHistory(address: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.apiBase}/addresses/${address}/transactions`);
      const json = await res.json() as any;
      return json.items || [];
    } catch {
      return [];
    }
  }

  async getTokenHolders(assetAddress: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.apiBase}/tokens/${assetAddress}/holders`);
      const json = await res.json() as any;
      return json.items || [];
    } catch {
      return [];
    }
  }

  async isSourceVerified(address: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/smart-contracts/${address}`);
      const json = await res.json() as any;
      return !!json.is_verified;
    } catch {
      return false;
    }
  }
}

