import { UAIMWalletDNA } from '../../../../models/uaim/types.js';

export class AddressResolver {
  static resolveAddressType(address: string): 'evm' | 'solana' | 'unknown' {
    const cleanAddress = address.trim();
    
    // EVM Hex check
    if (/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      return 'evm';
    }
    
    // Solana base58 check
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanAddress)) {
      return 'solana';
    }
    
    return 'unknown';
  }
}

export interface ReputationEntry {
  address: string;
  flags: string[];
  totalLaunches: number;
  ruggedCount: number;
  diedCount: number;
  trustScore: number;
}

export class CrossChainReputationCache {
  private cache = new Map<string, ReputationEntry>();

  constructor() {
    // Seed some mock reputation flags
    this.setReputation('0xevm_sender_address_abc123', {
      address: '0xevm_sender_address_abc123',
      flags: ['SERIAL_RUGGER', 'INSIDER_DEPLOYMENT'],
      totalLaunches: 15,
      ruggedCount: 8,
      diedCount: 5,
      trustScore: 0.05
    });

    this.setReputation('So11111111111111111111111111111111111111112', {
      address: 'So11111111111111111111111111111111111111112',
      flags: [],
      totalLaunches: 0,
      ruggedCount: 0,
      diedCount: 0,
      trustScore: 0.9
    });
  }

  setReputation(address: string, entry: ReputationEntry): void {
    this.cache.set(address.toLowerCase(), entry);
  }

  getReputation(address: string): ReputationEntry | undefined {
    return this.cache.get(address.toLowerCase());
  }

  getUnifiedWalletDNA(address: string): UAIMWalletDNA {
    const rep = this.getReputation(address);

    return {
      age: 30 * 24 * 3600 * 1000, // 30 days
      fundingLineage: {
        firstInboundTimestamp: Date.now() - 30 * 24 * 3600 * 1000,
        sourceType: 'peer'
      },
      behaviorFingerprint: {
        buySizeEntropy: 0.5,
        holdTimesMs: [],
        venueHabits: []
      },
      reputationTags: rep?.flags || []
    };
  }
}
