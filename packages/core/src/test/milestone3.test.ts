import test from 'node:test';
import assert from 'node:assert';
import { RobinhoodChainClient } from '../../../../chains/robinhood/client/client.js';
import { RobinhoodControlProbe } from '../../../../chains/robinhood/adapters/probe.js';
import { checkStockTokenImpersonation } from '../../../../chains/robinhood/adapters/registry.js';
import { RobinhoodDexAdapter } from '../../../../chains/robinhood/adapters/dex.js';
import { normalizeEVMDataToUAIM } from '../../../../chains/robinhood/adapters/normalize.js';
import { runRiskRules } from '../../../../engine/risk/evaluator.js';
import { scoreUaimDocument } from '../../../../engine/scoring/scorer.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('Milestone 3: Robinhood Chain Client Honeypot Simulation', async () => {
  const client = new RobinhoodChainClient();

  // Test successful call
  const goodCall = await client.simulateCall('0x1111111111111111111111111111111111111111', '0x');
  assert.strictEqual(goodCall.success, true);

  // Test honeypot call (ends with '000')
  const badCall = await client.simulateCall('0x1111111111111111111111111111111111111000', '0x');
  assert.strictEqual(badCall.success, false);
  assert.strictEqual(badCall.revertReason, 'HONEYPOT_DETECTED_TRANSFER_BLOCKED');
});

test('Milestone 3: Stock Token Impersonation Registry', () => {
  // Test official NVDA match (real contract)
  const realNVDA = checkStockTokenImpersonation('NVDA', '0xabcde123456789012345678901234567890abcde');
  assert.strictEqual(realNVDA.isImpersonator, false);

  // Test official NVDA impersonator (fake contract)
  const fakeNVDA = checkStockTokenImpersonation('NVDA', '0xfakefakefakefakefakefakefakefakefakefake');
  assert.strictEqual(fakeNVDA.isImpersonator, true);
  assert.strictEqual(fakeNVDA.targetRealAsset?.toLowerCase(), '0xabcde123456789012345678901234567890abcde');

  // Test fuzzy lookalike (NVDIA)
  const fuzzyNVDA = checkStockTokenImpersonation('NVDIA', '0xfake');
  assert.strictEqual(fuzzyNVDA.isImpersonator, true);
  assert.strictEqual(fuzzyNVDA.targetRealAsset?.toLowerCase(), '0xabcde123456789012345678901234567890abcde');

  // Test unrelated organic token
  const organic = checkStockTokenImpersonation('CASHCAT', '0x123');
  assert.strictEqual(organic.isImpersonator, false);
});

test('Milestone 3: Uniswap v3 concentrated LP model', async () => {
  const dex = new RobinhoodDexAdapter();
  const market = await dex.getMarketState('0x123');

  assert.strictEqual(market.venues[0].venue, 'Uniswap v3');
  assert.strictEqual(market.venues[0].model, 'nftPosition');
  assert.strictEqual(market.venues[0].lpCustody.status, 'locked');
});

test('Milestone 3: Scorer output with EVM mock data', () => {
  const rulesPath = join(process.cwd(), 'plugins/risk-rules/rules.json');
  const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

  const controlSurface = {
    powers: [
      { power: 'pause', holder: '0xcreator', severity: 'medium', evidence: 'paused modifier' }
    ],
    sellability: { simulated: true, result: 'honeypot', taxEstimate: 0.99 } // Honeypot trigger
  };

  const launchContext = {
    launchSource: 'hoodfun',
    creatorPriorLaunches: 3,
    creatorDied: 3, // deadRatio = 100% -> bad dev history
    creatorReputationScore: 0 // Dev holds check fail
  };

  const marketContext = {
    price: 0.05,
    marketCap: 50000,
    venues: [
      { venue: 'Uniswap v3', model: 'nftPosition', depth: 20000, lpCustody: { status: 'heldBy', owner: '0xcreator' }, shareOfSupplyInPool: 0.8 } // LP Unlocked
    ]
  };

  const uaim = normalizeEVMDataToUAIM(
    '4663',
    '0xNVDAImpersonator000', // Fake NVDA & Honeypot Address
    'NVDA',
    'NVIDIA Stock Token Fake',
    '0xcreator',
    launchContext,
    marketContext,
    controlSurface
  );

  uaim.ownership.clusterAdjustedConcentration = 0.75;

  const detectedRisks = runRiskRules(uaim, rules);
  const scoredUaim = scoreUaimDocument(uaim, detectedRisks);

  // NVIDIA Ticker Impersonation warning
  assert.strictEqual(scoredUaim.narrative.impersonationCheckResult.isImpersonator, true);

  // Verdict should be CAP due to extreme risk parameters
  assert.strictEqual(scoredUaim.score.verdict, 'CAP');
  assert.strictEqual(scoredUaim.score.subclass, 'extraction');
  
  console.log('✅ Milestone 3: All EVM tests passed successfully!');
});
