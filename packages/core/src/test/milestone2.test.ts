import test from 'node:test';
import assert from 'node:assert';
import fs, { readFileSync } from 'node:fs';
import path, { join } from 'node:path';
import type { FeatureEvaluationContext } from '../engine/features.js';
import { evaluateVerdictUAIM, ScorerThresholds } from '../engine/scorer.js';
import { mapSolanaContextToUAIM } from '../../../../chains/solana/adapters/normalize.js';
import { runRiskRules } from '../../../../engine/risk/evaluator.js';
import { scoreUaimDocument } from '../../../../engine/scoring/scorer.js';
import { ChainRegistry } from '../registry/index.js';

const thresholds: ScorerThresholds = {
  maxParentShare: 0.60,
  maxFreshWalletRatio: 0.60,
  maxBlockTrades: 5,
  maxSizeUniformity: 0.05,
  maxDevLaunchesDead: 3,
  minDevHoldSol: 0,
  maxBadOverlapCount: 2
};

test('Milestone 2: Dynamic JSON Rules Engine & Scorer Test', () => {
  // Load dynamic rules from plugins/
  const rulesPath = join(process.cwd(), 'plugins/risk-rules/rules.json');
  const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

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

  // 1. Map to UAIM
  const uaimDoc = mapSolanaContextToUAIM(mockCtx);

  // 2. Evaluate with Scorer (Milestone 1)
  const uaimScoredM1 = evaluateVerdictUAIM(JSON.parse(JSON.stringify(uaimDoc)), thresholds);

  // 3. Evaluate dynamically with JSON Rules & Scorer (Milestone 2)
  const detectedRisks = runRiskRules(uaimDoc, rules);
  const uaimScoredM2 = scoreUaimDocument(uaimDoc, detectedRisks);

  // 4. Assert both scorers give the same verdict and final score
  assert.strictEqual(uaimScoredM2.score.verdict, uaimScoredM1.score.verdict);
  assert.strictEqual(uaimScoredM2.score.subclass, uaimScoredM1.score.subclass);
  assert.strictEqual(uaimScoredM2.score.value, uaimScoredM1.score.value);

  // 5. Test Chain Registry
  const registry = new ChainRegistry();
  assert.strictEqual(registry.hasCapability('solana', 'canSimulateSell'), false);
  assert.strictEqual(registry.hasCapability('4663', 'canSimulateSell'), true);

  console.log('✅ Milestone 2: Test passed successfully. Dynamic JSON Scorer matches static Scorer!');
});

test('Milestone 2: Modular boundaries & Import Restrictions Lint Check', () => {

  function checkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDir(fullPath);
      } else if (file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Check for imports from chains
        const hasChainsImport = /from\s+['"][^'"]*chains\/[^'"]*['"]/g.test(content) || 
                              /from\s+['"]@nocap\/solana['"]/g.test(content);
        if (hasChainsImport && !fullPath.includes('test')) {
          assert.fail(`Lint violation: File ${fullPath} imports from chains/. Intentionally kept chain-agnostic.`);
        }
      }
    }
  }

  checkDir(path.join(process.cwd(), 'packages/core/src/engine'));
  checkDir(path.join(process.cwd(), 'engine'));
  console.log('✅ Milestone 2: Boundary check passed. 0 leaks from chains/ detected.');
});

