import { ComputedFeatures } from './features.js';

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

export function evaluateVerdict(features: ComputedFeatures, thresholds: ScorerThresholds, tradeCount: number = 20): ScorerVerdictResult {
  const reasons: ScorerVerdictReason[] = [];
  let scoreSum = 0;
  let maxScorePossible = 0;

  // Rule 1: Shared funding parent (Weight: 3)
  maxScorePossible += 3;
  if (features.funding_parent_share >= thresholds.maxParentShare) {
    scoreSum += 3;
    reasons.push({
      code: 'SHARED_FUNDING_PARENT',
      text: `${Math.round(features.funding_parent_share * 100)}% of buyers share a single funding parent. Typical extraction cluster.`,
      severity: 'high'
    });
  }

  // Rule 2: Funded by deployer directly or 1 hop (Weight: 2)
  maxScorePossible += 2;
  if (features.deployer_funded > 0.05) {
    scoreSum += 2;
    reasons.push({
      code: 'DEPLOYER_FUNDED_BUYERS',
      text: `${Math.round(features.deployer_funded * 100)}% of buyers funded directly or 1-hop by deployer.`,
      severity: 'high'
    });
  }

  // Rule 3: Uniform sizing (Weight: 3)
  maxScorePossible += 3;
  if (features.size_uniformity < thresholds.maxSizeUniformity) {
    scoreSum += 3;
    reasons.push({
      code: 'UNIFORM_BUY_SIZES',
      text: `Buy sizes standard dev is ${features.size_uniformity.toFixed(4)} SOL (under threshold). Pattern suggests automated bot deployment.`,
      severity: 'high'
    });
  }

  // Rule 4: Block concentration (Weight: 2)
  maxScorePossible += 2;
  if (features.same_block_count >= thresholds.maxBlockTrades) {
    scoreSum += 2;
    reasons.push({
      code: 'SAME_BLOCK_CONCENTRATION',
      text: `${features.same_block_count} buys executed in the exact launch block. Sniper pattern.`,
      severity: 'medium'
    });
  }

  // Rule 5: Fresh wallets ratio (Weight: 1)
  maxScorePossible += 1;
  if (features.fresh_wallet_ratio >= thresholds.maxFreshWalletRatio) {
    scoreSum += 1;
    reasons.push({
      code: 'FRESH_WALLETS_RATIO',
      text: `${Math.round(features.fresh_wallet_ratio * 100)}% of buyers wallets are less than 24 hours old.`,
      severity: 'medium'
    });
  }

  // Rule 6: Dev bad history (Weight: 2)
  maxScorePossible += 2;
  if (features.dev_history.launches > 2 && features.dev_history.dead_under_10m_ratio >= thresholds.maxDevLaunchesDead) {
    scoreSum += 2;
    reasons.push({
      code: 'DEV_BAD_HISTORY',
      text: `Developer has ${features.dev_history.launches} launches, ${Math.round(features.dev_history.dead_under_10m_ratio * 100)}% died under 10 minutes.`,
      severity: 'high'
    });
  }

  // Rule 7: Dev sells (Weight: 1)
  maxScorePossible += 1;
  if (!features.dev_commitment.dev_holds_at_trade_20) {
    scoreSum += 1;
    reasons.push({
      code: 'DEV_DUMPED_EARLY',
      text: 'Developer sold tokens before trade 20 check.',
      severity: 'high'
    });
  }

  // Rule 8: Known bad overlap (Weight: 2)
  maxScorePossible += 2;
  if (features.known_bad_overlap >= thresholds.maxBadOverlapCount) {
    scoreSum += 2;
    reasons.push({
      code: 'KNOWN_BAD_ACTORS',
      text: `Detected ${features.known_bad_overlap} buyers linked to previous confirmed rugs.`,
      severity: 'high'
    });
  }

  const rawConfidence = scoreSum / maxScorePossible;
  const completeness = Math.min(1, tradeCount / 20);
  const confidence = rawConfidence * completeness;

  let verdictLevel: 'PRELIMINARY' | 'PROVISIONAL' | 'FINAL' = 'FINAL';
  if (tradeCount < 10) {
    verdictLevel = 'PRELIMINARY';
  } else if (tradeCount < 20) {
    verdictLevel = 'PROVISIONAL';
  }

  let verdict: 'CAP' | 'NO CAP' = 'NO CAP';
  let subclass: 'extraction' | 'organic' | 'coordinated' = 'organic';

  if (rawConfidence >= 0.45) {
    verdict = 'CAP';
    subclass = 'extraction';
  } else if (features.funding_parent_share > 0.20 || features.same_block_count >= 3) {
    verdict = 'NO CAP';
    subclass = 'coordinated'; // coordinated but not confirmed extraction yet. v1 maps to NO CAP with warning
    reasons.push({
      code: 'COORDINATED_WARNING',
      text: 'Coordinated buying patterns detected. Trade with caution.',
      severity: 'low'
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

  return {
    verdict,
    subclass,
    confidence: Math.round(confidence * 100) / 100,
    reasons,
    verdictLevel,
  };
}
