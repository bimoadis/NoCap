export interface ChainCapability {
  canSimulateSell: boolean;
  hasVerifiedSource: boolean;
  hasIssuerRegistry: boolean;
  lpModel: 'fungible' | 'nftPosition';
}

export interface ChainRegistryEntry {
  chainId: string;
  chainName: string;
  capabilities: ChainCapability;
  adapters: {
    client: string;
    explorer: string;
    dex: string;
    launchSource: string;
  };
  regimeVersion: string;
}

export class ChainRegistry {
  private registry = new Map<string, ChainRegistryEntry>();

  constructor() {
    // Register Solana
    this.registerChain({
      chainId: 'solana',
      chainName: 'Solana',
      capabilities: {
        canSimulateSell: false, // Solana doesn't have eth_call simulation easily
        hasVerifiedSource: false,
        hasIssuerRegistry: false,
        lpModel: 'fungible'
      },
      adapters: {
        client: 'SolanaClient',
        explorer: 'SolscanExplorer',
        dex: 'RaydiumDex',
        launchSource: 'PumpfunLaunchpad'
      },
      regimeVersion: 'W14'
    });

    // Register Robinhood Chain
    this.registerChain({
      chainId: '4663',
      chainName: 'Robinhood Chain',
      capabilities: {
        canSimulateSell: true,
        hasVerifiedSource: true,
        hasIssuerRegistry: true,
        lpModel: 'nftPosition' // Uniswap v3 positions are NFTs
      },
      adapters: {
        client: 'RobinhoodClient',
        explorer: 'BlockscoutExplorer',
        dex: 'UniswapV3Dex',
        launchSource: 'HoodfunLaunchpad'
      },
      regimeVersion: 'RH_V1'
    });
  }

  registerChain(entry: ChainRegistryEntry): void {
    this.registry.set(entry.chainId, entry);
  }

  getChain(chainId: string): ChainRegistryEntry | undefined {
    return this.registry.get(chainId);
  }

  hasCapability(chainId: string, capability: keyof ChainCapability): boolean {
    const entry = this.getChain(chainId);
    if (!entry) return false;
    return !!entry.capabilities[capability];
  }
}
