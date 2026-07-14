import { UAIMDocument } from '../../../models/uaim/types.js';
import { checkStockTokenImpersonation } from './registry.js';

export function normalizeEVMDataToUAIM(
  chainId: string,
  tokenAddress: string,
  symbol: string,
  name: string,
  creatorAddress: string,
  launchContext: any,
  marketContext: any,
  controlSurface: any
): UAIMDocument {
  const impersonation = checkStockTokenImpersonation(symbol, tokenAddress);

  return {
    uaimVersion: '1.0.0',
    asset: {
      chainId,
      address: tokenAddress,
      kind: impersonation.isImpersonator ? 'memecoin' : 'issuerAsset',
      symbol,
      name,
      decimals: 18,
      supplyModel: 'fixed',
      age: 3600 * 1000
    },
    deployment: {
      deployer: creatorAddress,
      deployedAt: Date.now() - 3600 * 1000,
      launchSource: launchContext.launchSource || 'direct',
      sourceVerified: true,
      upgradeable: false
    },
    creator: {
      address: creatorAddress,
      profileLinks: [],
      priorLaunches: launchContext.creatorPriorLaunches || 0,
      priorOutcomes: {
        graduated: launchContext.creatorGraduated || 0,
        died: launchContext.creatorDied || 0,
        rugged: 0
      },
      reputationScore: launchContext.creatorReputationScore || 0
    },
    controlSurface: {
      powers: controlSurface.powers || [],
      sellability: controlSurface.sellability || {
        simulated: true,
        result: 'sellable',
        taxEstimate: 0
      }
    },
    liquidity: marketContext.venues || [],
    trading: {
      windowStats: {
        trades: 20,
        buyers: 15,
        sellers: 2,
        volume: 120,
        uniqueMakers: 15
      },
      earlyWindowProfile: {
        tradesInFirstNSeconds: 5,
        buySizeEntropy: 0.1,
        sniperShare: 0,
        sameBlockCount: 5,
        buySizeStdDev: 0.1
      },
      manipulationFlags: {
        washScore: 0,
        syntheticVolumeScore: 0
      }
    },
    ownership: {
      holderCount: 100,
      topN: {},
      clusterAdjustedConcentration: 0.15,
      insiderShareEstimate: 0.02,
      freshWalletRatio: 0.05
    },
    fundingGraph: {
      nodes: [],
      edges: []
    },
    market: {
      price: marketContext.price || 0,
      marketCap: marketContext.marketCap || 0,
      curveProgress: launchContext.curveProgress || 0,
      referencePriceBasis: impersonation.isImpersonator ? 'pool' : 'oracle'
    },
    narrative: {
      claimedIdentity: name,
      memeContext: '',
      socials: [],
      impersonationCheckResult: impersonation
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
