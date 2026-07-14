export interface UAIMAsset {
  chainId: string;
  address: string;
  kind: 'memecoin' | 'issuerAsset' | 'stable' | 'lpPosition' | 'unknown';
  symbol: string;
  name: string;
  decimals: number;
  supplyModel: 'fixed' | 'mintable' | 'rebasing';
  age: number; // e.g. age in milliseconds
}

export interface UAIMDeployment {
  deployer: string;
  deployedAt: number; // timestamp in ms
  launchSource: 'pumpfun' | 'hoodfun' | 'noxa' | 'direct' | 'issuer';
  factoryUsed?: string;
  sourceVerified: boolean;
  upgradeable: boolean;
}

export interface UAIMCreator {
  address: string;
  profileLinks: string[];
  priorLaunches: number;
  priorOutcomes: {
    graduated: number;
    died: number;
    rugged: number;
  };
  reputationScore: number;
}

export interface UAIMPower {
  power: 'mint' | 'freeze' | 'pause' | 'upgrade' | 'feeMutation';
  holder: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
}

export interface UAIMControlSurface {
  powers: UAIMPower[];
  sellability: {
    simulated: boolean;
    result: 'sellable' | 'honeypot' | 'untested';
    taxEstimate: number; // percentage tax 0 to 1
  };
}

export interface UAIMLiquidityVenue {
  venue: string;
  model: 'fungibleLp' | 'nftPosition' | 'bondingCurve';
  depth: number; // quote token value
  lpCustody: {
    status: 'burned' | 'locked' | 'heldBy';
    until?: number; // lock duration/expiration timestamp
    locker?: string;
    owner?: string;
  };
  shareOfSupplyInPool: number; // 0 to 1
}

export interface UAIMTrading {
  windowStats: {
    trades: number;
    buyers: number;
    sellers: number;
    volume: number;
    uniqueMakers: number;
  };
  earlyWindowProfile: {
    tradesInFirstNSeconds: number;
    buySizeEntropy: number;
    sniperShare: number;
    sameBlockCount?: number;
    buySizeStdDev?: number;
  };
  manipulationFlags: {
    washScore: number;
    syntheticVolumeScore: number;
  };
}

export interface UAIMOwnership {
  holderCount: number;
  topN: Record<string, number>; // maps address/cluster to percentage (0 to 1)
  clusterAdjustedConcentration: number; // 0 to 1
  insiderShareEstimate: number; // 0 to 1
  freshWalletRatio?: number; // 0 to 1
}

export interface UAIMFundingNode {
  address: string;
  type: 'eoa' | 'cex' | 'bridge' | 'deployer';
  chain?: string;
}

export interface UAIMFundingEdge {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
}

export interface UAIMFundingGraph {
  nodes: UAIMFundingNode[];
  edges: UAIMFundingEdge[];
}

export interface UAIMMarket {
  price: number;
  marketCap: number; // or FDV
  curveProgress?: number; // 0 to 1 if bondingCurve
  referencePriceBasis: 'curve' | 'pool' | 'oracle';
  oracleDeviation?: number; // difference fraction for Stock Tokens
}

export interface UAIMNarrative {
  claimedIdentity: string;
  memeContext: string;
  socials: Array<{
    platform: string;
    url: string;
    verifiedMatch: boolean;
  }>;
  impersonationCheckResult: {
    isImpersonator: boolean;
    targetRealAsset?: string;
  };
}

export interface UAIMWalletDNA {
  age: number;
  fundingLineage: {
    firstInboundTimestamp: number;
    sourceType: 'bridge' | 'cex' | 'deployer' | 'peer';
    sourceAddress?: string;
  };
  behaviorFingerprint: {
    buySizeEntropy: number;
    holdTimesMs: number[];
    venueHabits: string[];
  };
  reputationTags: string[];
}

export interface UAIMRiskCode {
  code: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0 to 1
  evidence: string;
}

export interface UAIMScore {
  value: number; // 0 to 100
  verdict: 'CAP' | 'NO CAP';
  subclass: 'extraction' | 'organic' | 'coordinated';
  confidence: number; // 0 to 1
  regimeVersion: string;
  oneLineReason: string;
}

export interface UAIMWarning {
  code: string;
  message: string;
  type: 'capabilityGap' | 'dataQuality' | 'general';
}

export interface UAIMProvenance {
  adapter: string;
  fields: string[];
  fetchTimestamp: number;
  dataSource: string;
}

export interface UAIMDocument {
  uaimVersion: string;
  asset: UAIMAsset;
  deployment: UAIMDeployment;
  creator: UAIMCreator;
  controlSurface: UAIMControlSurface;
  liquidity: UAIMLiquidityVenue[];
  trading: UAIMTrading;
  ownership: UAIMOwnership;
  fundingGraph: UAIMFundingGraph;
  market: UAIMMarket;
  narrative: UAIMNarrative;
  risks: UAIMRiskCode[];
  score: UAIMScore;
  warnings: UAIMWarning[];
  provenance: UAIMProvenance[];
}
