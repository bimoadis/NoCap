import { UAIMDocument, UAIMRiskCode } from '../../models/uaim/types.js';

const RULE_WEIGHTS: Record<string, number> = {
  SHARED_FUNDING_PARENT: 5,
  DEPLOYER_FUNDED_BUYERS: 5,
  KNOWN_BAD_ACTORS: 5,
  DEV_BAD_HISTORY: 4,
  DEV_DUMPED_EARLY: 4,
  SAME_BLOCK_CONCENTRATION: 3,
  UNIFORM_BUY_SIZES: 3,
  FRESH_WALLETS_RATIO: 2,
  CLUSTER_DOMINANCE: 5
};

const MAX_SCORE_POSSIBLE = 36;

export function scoreUaimDocument(uaim: UAIMDocument, risks: UAIMRiskCode[]): UAIMDocument {
  let scoreSum = 0;
  for (const risk of risks) {
    scoreSum += RULE_WEIGHTS[risk.code] || 0;
  }

  let riskScore = Math.round((scoreSum / MAX_SCORE_POSSIBLE) * 100);
  let verdict: 'CAP' | 'NO CAP' = 'NO CAP';
  let subclass: 'extraction' | 'organic' | 'coordinated' = 'organic';

  const parentShare = uaim.ownership.clusterAdjustedConcentration;
  const clusterDominance = uaim.ownership.clusterAdjustedConcentration;

  if (riskScore >= 60 || parentShare >= 0.60 || clusterDominance >= 0.70) {
    verdict = 'CAP';
    subclass = 'extraction';
    riskScore = Math.max(riskScore, 60);
  } else if (riskScore >= 30 || parentShare >= 0.20 || clusterDominance >= 0.30) {
    verdict = 'NO CAP';
    subclass = 'coordinated';
    riskScore = Math.max(riskScore, 30);
  } else {
    verdict = 'NO CAP';
    subclass = 'organic';
  }

  uaim.score = {
    value: riskScore,
    verdict,
    subclass,
    confidence: riskScore / 100,
    regimeVersion: 'W14',
    oneLineReason: risks[0] ? `Risk detected: ${risks[0].code}` : 'Funding and buyer patterns appear organic.'
  };
  uaim.risks = risks;

  return uaim;
}
