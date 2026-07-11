export interface FeatureEvaluationContext {
  mint: string;
  creator: string;
  socialsExist: boolean;
  trades: Array<{
    trader: string;
    side: 'buy' | 'sell';
    solAmount: number;
    tokenAmount: number;
    slot: number;
    signature: string;
    timestamp: number;
  }>;
  walletProfiles: Record<string, {
    address: string;
    txCount: number;
    firstTxTimestamp: Date | null;
    funderType: string;
    reputationFlags: string[];
    launches: number;
    deadUnder10m: number;
    avgExtractionSol: number;
    trust: number;
  }>;
  fundingSources: Record<string, {
    funder: string;
    funderType: string; // 'cex' | 'deployer' | 'buyer' | 'unknown'
    timeToLaunchMs: number;
  }>;
}

export interface ComputedFeatures {
  funding_parent_share: number;
  deployer_funded: number;
  same_block_count: number;
  size_uniformity: number; // Standard deviation of SOL buys
  fresh_wallet_ratio: number;
  dev_history: {
    launches: number;
    dead_under_10m_ratio: number;
  };
  dev_commitment: {
    dev_holds_at_trade_20: boolean;
    socials_exist: boolean;
  };
  known_bad_overlap: number;
  cluster_dominance: number;
}

// Helpers
function stdDev(array: number[]): number {
  if (array.length === 0) return 0;
  const n = array.length;
  const mean = array.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);
}

export function computeFeatures(ctx: FeatureEvaluationContext): ComputedFeatures {
  const totalBuyers = ctx.trades.length;
  if (totalBuyers === 0) {
    return {
      funding_parent_share: 0,
      deployer_funded: 0,
      same_block_count: 0,
      size_uniformity: 0,
      fresh_wallet_ratio: 0,
      dev_history: { launches: 0, dead_under_10m_ratio: 0 },
      dev_commitment: { dev_holds_at_trade_20: false, socials_exist: false },
      known_bad_overlap: 0,
      cluster_dominance: 0,
    };
  }

  // 1. funding_parent_share: proportion of buyers funded by the same non-CEX parent
  const parentGroups: Record<string, number> = {};
  for (const t of ctx.trades) {
    const funding = ctx.fundingSources[t.trader];
    if (funding && funding.funder && funding.funderType !== 'cex') {
      parentGroups[funding.funder] = (parentGroups[funding.funder] || 0) + 1;
    }
  }
  let maxParentCount = 0;
  for (const parent in parentGroups) {
    if (parentGroups[parent] > maxParentCount) {
      maxParentCount = parentGroups[parent];
    }
  }
  const funding_parent_share = maxParentCount / totalBuyers;

  // 2. deployer_funded: buyer funded directly or 1 hop by deployer
  let deployerFundedCount = 0;
  for (const t of ctx.trades) {
    const funding = ctx.fundingSources[t.trader];
    if (funding && (funding.funder === ctx.creator || funding.funderType === 'deployer')) {
      deployerFundedCount++;
    }
  }
  const deployer_funded = deployerFundedCount / totalBuyers;

  // 3. same_block_count: trades in same slot/block as creation/first trade
  const initialSlot = ctx.trades[0]?.slot || 0;
  const same_block_count = ctx.trades.filter(t => t.slot === initialSlot).length;

  // 4. size_uniformity: standard deviation of buy sizes in SOL
  const buySizes = ctx.trades.map(t => t.solAmount);
  const size_uniformity = stdDev(buySizes);

  // 5. fresh_wallet_ratio: buyers with age < 1 day (86400 seconds)
  let freshCount = 0;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const firstTradeTimestamp = ctx.trades[0]?.timestamp * 1000 || Date.now();
  for (const t of ctx.trades) {
    const profile = ctx.walletProfiles[t.trader];
    if (profile && profile.firstTxTimestamp) {
      const ageMs = firstTradeTimestamp - profile.firstTxTimestamp.getTime();
      if (ageMs < oneDayMs && ageMs >= 0) {
        freshCount++;
      }
    } else {
      // If no profile, assume fresh
      freshCount++;
    }
  }
  const fresh_wallet_ratio = freshCount / totalBuyers;

  // 6. dev_history
  const devProfile = ctx.walletProfiles[ctx.creator];
  const devLaunches = devProfile?.launches || 0;
  const devDeadRatio = devLaunches > 0 ? (devProfile?.deadUnder10m || 0) / devLaunches : 0.0;

  // 7. dev_commitment: does dev hold token at trade 20, metadata socials exist
  // We check if dev sold in the buffered trades
  const devSells = ctx.trades.some(t => t.trader === ctx.creator && t.side === 'sell');
  const dev_commitment = {
    dev_holds_at_trade_20: !devSells,
    socials_exist: ctx.socialsExist,
  };

  // 8. known_bad_overlap: buyer who is flagged for prior rugs
  let badOverlapCount = 0;
  for (const t of ctx.trades) {
    const profile = ctx.walletProfiles[t.trader];
    if (profile && profile.reputationFlags.some(f => f === 'known_sniper' || f === 'rug_participant')) {
      badOverlapCount++;
    }
  }

  // 9. cluster_dominance: total proportion of buyers in private parent clusters of size >= 2
  let clusterDominanceCount = 0;
  for (const parent in parentGroups) {
    if (parentGroups[parent] >= 2) {
      clusterDominanceCount += parentGroups[parent];
    }
  }
  const cluster_dominance = clusterDominanceCount / totalBuyers;

  return {
    funding_parent_share,
    deployer_funded,
    same_block_count,
    size_uniformity,
    fresh_wallet_ratio,
    dev_history: {
      launches: devLaunches,
      dead_under_10m_ratio: devDeadRatio,
    },
    dev_commitment,
    known_bad_overlap: badOverlapCount,
    cluster_dominance,
  };
}
