import test from 'node:test';
import assert from 'node:assert';
import type { FeatureEvaluationContext } from '../engine/features.js';
import { computeFeatures } from '../engine/features.js';
import { evaluateVerdict, evaluateVerdictUAIM } from '../engine/scorer.js';
import type { ScorerThresholds } from '../engine/scorer.js';
import { mapSolanaContextToUAIM } from '../../../../chains/solana/adapters/normalize.js';

const thresholds: ScorerThresholds = {
  maxParentShare: 0.60,
  maxFreshWalletRatio: 0.60,
  maxBlockTrades: 5,
  maxSizeUniformity: 0.05,
  maxDevLaunchesDead: 3,
  minDevHoldSol: 0,
  maxBadOverlapCount: 2
};

test('Milestone 1: Solana Normalization & Scorer Byte-Identical Test', () => {
  const mockCtx: FeatureEvaluationContext = {
    mint: 'So11111111111111111111111111111111111111112',
    creator: 'CreatorWallet111111111111111111111111111',
    socialsExist: true,
    trades: Array.from({ length: 20 }, (_, i) => ({
      trader: `TraderWallet${i % 3}`, // 3 unique traders -> high bundling
      side: 'buy',
      solAmount: 0.1, // uniform buy sizes
      tokenAmount: 1000000,
      slot: 123456, // same slot
      signature: `sig_${i}`,
      timestamp: 1710000000 + i
    })),
    walletProfiles: {
      'CreatorWallet111111111111111111111111111': {
        address: 'CreatorWallet111111111111111111111111111',
        txCount: 15,
        firstTxTimestamp: new Date(1700000000000),
        funderType: 'cex',
        reputationFlags: [],
        launches: 4,
        deadUnder10m: 3,
        avgExtractionSol: 5,
        trust: 0.1
      }
    },
    fundingSources: {
      'TraderWallet0': { funder: 'ParentWallet111111111111111111111111', funderType: 'eoa', timeToLaunchMs: 60000 },
      'TraderWallet1': { funder: 'ParentWallet111111111111111111111111', funderType: 'eoa', timeToLaunchMs: 60000 },
      'TraderWallet2': { funder: 'ParentWallet111111111111111111111111', funderType: 'eoa', timeToLaunchMs: 60000 }
    }
  };

  // 1. Run original features & scorer
  const legacyFeatures = computeFeatures(mockCtx);
  const legacyResult = evaluateVerdict(legacyFeatures, thresholds, 20);

  // 2. Map to UAIM and run new UAIM scorer
  const uaimDoc = mapSolanaContextToUAIM(mockCtx);
  const updatedUaim = evaluateVerdictUAIM(uaimDoc, thresholds);

  // 3. Assert results are byte-identical
  assert.strictEqual(updatedUaim.score.verdict, legacyResult.verdict);
  assert.strictEqual(updatedUaim.score.subclass, legacyResult.subclass);
  assert.strictEqual(updatedUaim.score.value, Math.round(legacyResult.confidence * 100));
  assert.strictEqual(updatedUaim.score.confidence, legacyResult.confidence);
  
  console.log('✅ Milestone 1: Test passed successfully. Scoring outputs are identical!');
});
