import { ComputedFeatures } from './features.js';
import { UAIMDocument, UAIMRiskCode } from '../../../../models/uaim/types.js';

export interface ScorerThresholds {
  maxParentShare: number;
  maxFreshWalletRatio: number;
  maxBlockTrades: number;
  maxSizeUniformity: number;
  maxDevLaunchesDead: number;
  minDevHoldSol: number;
  maxBadOverlapCount: number;
}

export interface ScorerVerdictReason {
  code: string;
  text: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ScorerVerdictResult {
  verdict: 'CAP' | 'NO CAP';
  subclass: 'extraction' | 'organic' | 'coordinated';
  confidence: number;
  reasons: ScorerVerdictReason[];
  verdictLevel?: 'PRELIMINARY' | 'PROVISIONAL' | 'FINAL';
}

export function evaluateVerdictUAIM(uaim: UAIMDocument, thresholds: ScorerThresholds): UAIMDocument {
  const tradeCount = uaim.trading.windowStats.trades;
  const reasons: ScorerVerdictReason[] = [];
  const risks: UAIMRiskCode[] = [];
  let scoreSum = 0;
  const maxScorePossible = 36;

  // Rule 1: SHARED_FUNDING_PARENT
  const parentShare = uaim.ownership.clusterAdjustedConcentration;
  if (parentShare >= 0.60) {
    scoreSum += 5;
    reasons.push({
      code: 'SHARED_FUNDING_PARENT',
      text: `${Math.round(parentShare * 100)}% of buyers share a single funding parent. Strong bundling indicator.`,
      severity: 'high'
    });
    risks.push({ code: 'SHARED_FUNDING_PARENT', severity: 'high', confidence: 1, evidence: `${Math.round(parentShare * 100)}% shared parent` });
  }

  // Rule 2: DEPLOYER_FUNDED_BUYERS
  const deployerFunded = uaim.ownership.insiderShareEstimate ?? 0;
  if (deployerFunded >= 0.10) {
    scoreSum += 5;
    reasons.push({
      code: 'DEPLOYER_FUNDED_BUYERS',
      text: `${Math.round(deployerFunded * 100)}% of buyers funded directly or 1-hop by deployer.`,
      severity: 'high'
    });
    risks.push({ code: 'DEPLOYER_FUNDED_BUYERS', severity: 'high', confidence: 1, evidence: `${Math.round(deployerFunded * 100)}% deployer funded` });
  }

  // Rule 3: KNOWN_BAD_ACTORS
  const badOverlap = uaim.trading.earlyWindowProfile.sniperShare;
  if (badOverlap >= 2) {
    scoreSum += 5;
    reasons.push({
      code: 'KNOWN_BAD_ACTORS',
      text: `Detected ${badOverlap} buyers linked to previous confirmed rugs.`,
      severity: 'high'
    });
    risks.push({ code: 'KNOWN_BAD_ACTORS', severity: 'high', confidence: 1, evidence: `Found ${badOverlap} bad actors` });
  }

  // Rule 4: DEV_BAD_HISTORY
  const launches = uaim.creator.priorLaunches;
  const deadRatio = launches > 0 ? (uaim.creator.priorOutcomes.died / launches) : 0;
  if (launches >= 3 && deadRatio >= 0.70) {
    scoreSum += 4;
    reasons.push({
      code: 'DEV_BAD_HISTORY',
      text: `Developer has ${launches} launches, ${Math.round(deadRatio * 100)}% died under 10 minutes.`,
      severity: 'high'
    });
    risks.push({ code: 'DEV_BAD_HISTORY', severity: 'high', confidence: 1, evidence: `${launches} launches, ${Math.round(deadRatio * 100)}% dead` });
  }

  // Rule 5: DEV_DUMPED_EARLY
  const devHolds = uaim.creator.reputationScore === 1;
  if (!devHolds) {
    scoreSum += 4;
    reasons.push({
      code: 'DEV_DUMPED_EARLY',
      text: 'Developer sold tokens before trade 20 check.',
      severity: 'high'
    });
    risks.push({ code: 'DEV_DUMPED_EARLY', severity: 'high', confidence: 1, evidence: 'Developer sold early' });
  }

  // Rule 6: SAME_BLOCK_CONCENTRATION
  const sameBlockCount = uaim.trading.earlyWindowProfile.sameBlockCount ?? 0;
  const blockRatio = tradeCount > 0 ? (sameBlockCount / tradeCount) : 0;
  if (blockRatio >= 0.30) {
    scoreSum += 3;
    reasons.push({
      code: 'SAME_BLOCK_CONCENTRATION',
      text: `${Math.round(blockRatio * 100)}% of buyers executed in the exact launch block. Sniper pattern.`,
      severity: 'medium'
    });
    risks.push({ code: 'SAME_BLOCK_CONCENTRATION', severity: 'medium', confidence: 1, evidence: `${Math.round(blockRatio * 100)}% in launch block` });
  }

  // Rule 7: UNIFORM_BUY_SIZES
  const sizeUniformity = uaim.trading.earlyWindowProfile.buySizeStdDev ?? 0;
  if (sizeUniformity <= 0.05) {
    scoreSum += 3;
    reasons.push({
      code: 'UNIFORM_BUY_SIZES',
      text: `Buy sizes standard dev is ${sizeUniformity.toFixed(4)} SOL. Sizing uniformity suggests automated bot deployment.`,
      severity: 'medium'
    });
    risks.push({ code: 'UNIFORM_BUY_SIZES', severity: 'medium', confidence: 1, evidence: `StdDev: ${sizeUniformity.toFixed(4)}` });
  }

  // Rule 8: FRESH_WALLETS_RATIO
  const freshWalletRatio = uaim.ownership.freshWalletRatio ?? 0;
  if (freshWalletRatio >= 0.60) {
    scoreSum += 2;
    reasons.push({
      code: 'FRESH_WALLETS_RATIO',
      text: `${Math.round(freshWalletRatio * 100)}% of buyers wallets are less than 24 hours old.`,
      severity: 'medium'
    });
    risks.push({ code: 'FRESH_WALLETS_RATIO', severity: 'medium', confidence: 1, evidence: `${Math.round(freshWalletRatio * 100)}% fresh wallets` });
  }

  // Rule 9: CLUSTER_DOMINANCE
  const clusterDominance = uaim.ownership.clusterAdjustedConcentration; // mapped in normalize
  if (clusterDominance >= 0.70) {
    scoreSum += 5;
    reasons.push({
      code: 'CLUSTER_DOMINANCE',
      text: `Coordinated clusters dominate ${Math.round(clusterDominance * 100)}% of initial buys. Extreme bundling pattern.`,
      severity: 'high'
    });
    risks.push({ code: 'CLUSTER_DOMINANCE', severity: 'high', confidence: 1, evidence: `Cluster dominance ${Math.round(clusterDominance * 100)}%` });
  }

  let riskScore = Math.round((scoreSum / maxScorePossible) * 100);
  let verdict: 'CAP' | 'NO CAP' = 'NO CAP';
  let subclass: 'extraction' | 'organic' | 'coordinated' = 'organic';

  if (riskScore >= 60 || parentShare >= 0.60 || clusterDominance >= 0.70) {
    verdict = 'CAP';
    subclass = 'extraction';
    riskScore = Math.max(riskScore, 60);
  } else if (riskScore >= 30 || parentShare >= 0.20 || clusterDominance >= 0.30) {
    verdict = 'NO CAP';
    subclass = 'coordinated';
    riskScore = Math.max(riskScore, 30);
    reasons.push({
      code: 'COORDINATED_WARNING',
      text: 'Coordinated buying patterns detected. Trade with caution.',
      severity: 'medium'
    });
  } else {
    verdict = 'NO CAP';
    subclass = 'organic';
    if (reasons.length === 0) {
      reasons.push({
        code: 'ORGANIC_VERDICT',
        text: 'Funding and buyer sizing patterns appear organic.',
        severity: 'low'
      });
    }
  }

  let verdictLevel: 'PRELIMINARY' | 'PROVISIONAL' | 'FINAL' = 'FINAL';
  if (tradeCount < 10) {
    verdictLevel = 'PRELIMINARY';
  } else if (tradeCount < 20) {
    verdictLevel = 'PROVISIONAL';
  }

  uaim.score = {
    value: riskScore,
    verdict,
    subclass,
    confidence: riskScore / 100,
    regimeVersion: 'W14',
    oneLineReason: reasons[0]?.text || 'No risks detected.'
  };
  uaim.risks = risks;

  return uaim;
}

export function evaluateVerdict(features: ComputedFeatures, thresholds: ScorerThresholds, tradeCount: number = 20): ScorerVerdictResult {
  const reasons: ScorerVerdictReason[] = [];
  let scoreSum = 0;
  const maxScorePossible = 36; // 5 + 5 + 5 + 4 + 4 + 3 + 3 + 2 + 5 (added CLUSTER_DOMINANCE)

  // Rule 1: SHARED_FUNDING_PARENT (Weight: 5) - Critical
  if (features.funding_parent_share >= 0.60) {
    scoreSum += 5;
    reasons.push({
      code: 'SHARED_FUNDING_PARENT',
      text: `${Math.round(features.funding_parent_share * 100)}% of buyers share a single funding parent. Strong bundling indicator.`,
      severity: 'high'
    });
  }

  // Rule 2: DEPLOYER_FUNDED_BUYERS (Weight: 5) - Critical
  if (features.deployer_funded >= 0.10) {
    scoreSum += 5;
    reasons.push({
      code: 'DEPLOYER_FUNDED_BUYERS',
      text: `${Math.round(features.deployer_funded * 100)}% of buyers funded directly or 1-hop by deployer.`,
      severity: 'high'
    });
  }

  // Rule 3: KNOWN_BAD_ACTORS (Weight: 5) - Critical
  if (features.known_bad_overlap >= 2) {
    scoreSum += 5;
    reasons.push({
      code: 'KNOWN_BAD_ACTORS',
      text: `Detected ${features.known_bad_overlap} buyers linked to previous confirmed rugs.`,
      severity: 'high'
    });
  }

  // Rule 4: DEV_BAD_HISTORY (Weight: 4) - High
  if (features.dev_history.launches >= 3 && features.dev_history.dead_under_10m_ratio >= 0.70) {
    scoreSum += 4;
    reasons.push({
      code: 'DEV_BAD_HISTORY',
      text: `Developer has ${features.dev_history.launches} launches, ${Math.round(features.dev_history.dead_under_10m_ratio * 100)}% died under 10 minutes.`,
      severity: 'high'
    });
  }

  // Rule 5: DEV_DUMPED_EARLY (Weight: 4) - High
  if (!features.dev_commitment.dev_holds_at_trade_20) {
    scoreSum += 4;
    reasons.push({
      code: 'DEV_DUMPED_EARLY',
      text: 'Developer sold tokens before trade 20 check.',
      severity: 'high'
    });
  }

  // Rule 6: SAME_BLOCK_CONCENTRATION (Weight: 3) - Medium
  const blockRatio = tradeCount > 0 ? (features.same_block_count / tradeCount) : 0;
  if (blockRatio >= 0.30) {
    scoreSum += 3;
    reasons.push({
      code: 'SAME_BLOCK_CONCENTRATION',
      text: `${Math.round(blockRatio * 100)}% of buyers executed in the exact launch block. Sniper pattern.`,
      severity: 'medium'
    });
  }

  // Rule 7: UNIFORM_BUY_SIZES (Weight: 3) - Medium
  if (features.size_uniformity <= 0.05) {
    scoreSum += 3;
    reasons.push({
      code: 'UNIFORM_BUY_SIZES',
      text: `Buy sizes standard dev is ${features.size_uniformity.toFixed(4)} SOL. Sizing uniformity suggests automated bot deployment.`,
      severity: 'medium'
    });
  }

  // Rule 8: FRESH_WALLETS_RATIO (Weight: 2) - Low
  if (features.fresh_wallet_ratio >= 0.60) {
    scoreSum += 2;
    reasons.push({
      code: 'FRESH_WALLETS_RATIO',
      text: `${Math.round(features.fresh_wallet_ratio * 100)}% of buyers wallets are less than 24 hours old.`,
      severity: 'medium'
    });
  }

  // Rule 9: CLUSTER_DOMINANCE (Weight: 5) - Critical
  if (features.cluster_dominance >= 0.70) {
    scoreSum += 5;
    reasons.push({
      code: 'CLUSTER_DOMINANCE',
      text: `Coordinated clusters dominate ${Math.round(features.cluster_dominance * 100)}% of initial buys. Extreme bundling pattern.`,
      severity: 'high'
    });
  }

  let riskScore = Math.round((scoreSum / maxScorePossible) * 100);

  let verdict: 'CAP' | 'NO CAP' = 'NO CAP';
  let subclass: 'extraction' | 'organic' | 'coordinated' = 'organic';

  // Verdict Resolution based on Risk Score
  if (riskScore >= 60 || features.funding_parent_share >= 0.60 || features.cluster_dominance >= 0.70) {
    verdict = 'CAP';
    subclass = 'extraction';
    riskScore = Math.max(riskScore, 60);
  } else if (riskScore >= 30 || features.funding_parent_share >= 0.20 || features.cluster_dominance >= 0.30) {
    verdict = 'NO CAP';
    subclass = 'coordinated';
    riskScore = Math.max(riskScore, 30);
    reasons.push({
      code: 'COORDINATED_WARNING',
      text: 'Coordinated buying patterns detected. Trade with caution.',
      severity: 'medium'
    });
  } else {
    verdict = 'NO CAP';
    subclass = 'organic';
    if (reasons.length === 0) {
      reasons.push({
        code: 'ORGANIC_VERDICT',
        text: 'Funding and buyer sizing patterns appear organic.',
        severity: 'low'
      });
    }
  }

  let verdictLevel: 'PRELIMINARY' | 'PROVISIONAL' | 'FINAL' = 'FINAL';
  if (tradeCount < 10) {
    verdictLevel = 'PRELIMINARY';
  } else if (tradeCount < 20) {
    verdictLevel = 'PROVISIONAL';
  }

  return {
    verdict,
    subclass,
    confidence: riskScore / 100, // Return riskScore directly (0.0 to 1.0)
    reasons,
    verdictLevel,
  };
}
