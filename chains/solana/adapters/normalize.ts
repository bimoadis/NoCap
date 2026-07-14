import type { FeatureEvaluationContext } from '../../../packages/core/src/engine/features.js';
import { computeFeatures } from '../../../packages/core/src/engine/features.js';
import { UAIMDocument } from '../../../models/uaim/types.js';

export function mapSolanaContextToUAIM(ctx: FeatureEvaluationContext): UAIMDocument {
  // Compute features using the original math to preserve them
  const features = computeFeatures(ctx);

  const buySizes = ctx.trades.map(t => t.solAmount);
  const maxBuy = buySizes.length > 0 ? Math.max(...buySizes) : 0;

  // Build top holders map
  const topHolders: Record<string, number> = {};
  ctx.trades.forEach(t => {
    topHolders[t.trader] = (topHolders[t.trader] || 0) + (t.tokenAmount / 1e9); // simplified share
  });

  return {
    uaimVersion: '1.0.0',
    asset: {
      chainId: 'solana',
      address: ctx.mint,
      kind: 'memecoin',
      symbol: '',
      name: '',
      decimals: 9,
      supplyModel: 'fixed',
      age: ctx.trades.length > 0 ? (Date.now() - ctx.trades[0].timestamp * 1000) : 0
    },
    deployment: {
      deployer: ctx.creator,
      deployedAt: ctx.trades.length > 0 ? ctx.trades[0].timestamp * 1000 : Date.now(),
      launchSource: 'pumpfun',
      sourceVerified: true,
      upgradeable: false
    },
    creator: {
      address: ctx.creator,
      profileLinks: [],
      priorLaunches: ctx.walletProfiles[ctx.creator]?.launches || 0,
      priorOutcomes: {
        graduated: 0,
        died: ctx.walletProfiles[ctx.creator]?.deadUnder10m || 0,
        rugged: 0
      },
      reputationScore: features.dev_commitment.dev_holds_at_trade_20 ? 1 : 0
    },
    controlSurface: {
      powers: [],
      sellability: {
        simulated: false,
        result: 'untested',
        taxEstimate: 0
      }
    },
    liquidity: [],
    trading: {
      windowStats: {
        trades: ctx.trades.length,
        buyers: new Set(ctx.trades.map(t => t.trader)).size,
        sellers: ctx.trades.filter(t => t.side === 'sell').length,
        volume: buySizes.reduce((a, b) => a + b, 0),
        uniqueMakers: new Set(ctx.trades.map(t => t.trader)).size
      },
      earlyWindowProfile: {
        tradesInFirstNSeconds: features.same_block_count,
        buySizeEntropy: features.size_uniformity,
        sniperShare: features.known_bad_overlap,
        sameBlockCount: features.same_block_count,
        buySizeStdDev: features.size_uniformity
      },
      manipulationFlags: {
        washScore: 0,
        syntheticVolumeScore: 0
      }
    },
    ownership: {
      holderCount: Object.keys(topHolders).length,
      topN: topHolders,
      clusterAdjustedConcentration: features.funding_parent_share,
      insiderShareEstimate: features.deployer_funded,
      freshWalletRatio: features.fresh_wallet_ratio
    },
    fundingGraph: {
      nodes: Object.keys(ctx.fundingSources).map(addr => ({
        address: addr,
        type: ctx.fundingSources[addr].funderType === 'cex' ? 'cex' : 'eoa'
      })),
      edges: Object.keys(ctx.fundingSources).map(addr => ({
        from: ctx.fundingSources[addr].funder,
        to: addr,
        amount: 0,
        timestamp: Date.now() - ctx.fundingSources[addr].timeToLaunchMs
      }))
    },
    market: {
      price: 0,
      marketCap: 0,
      curveProgress: 0,
      referencePriceBasis: 'curve'
    },
    narrative: {
      claimedIdentity: '',
      memeContext: '',
      socials: ctx.socialsExist ? [{ platform: 'x', url: 'https://x.com', verifiedMatch: true }] : [],
      impersonationCheckResult: { isImpersonator: false }
    },
    risks: [],
    score: {
      value: 0,
      verdict: 'NO CAP',
      subclass: 'organic',
      confidence: 0,
      regimeVersion: 'W14',
      oneLineReason: ''
    },
    warnings: [],
    provenance: []
  };
}
