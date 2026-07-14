import test from 'node:test';
import assert from 'node:assert';
import { AddressResolver, CrossChainReputationCache } from '../reputation/cache.js';
import { BridgeTracker } from '../reputation/bridge.js';

test('Milestone 4: Unified Address Resolver', () => {
  // Test EVM address identification
  assert.strictEqual(AddressResolver.resolveAddressType('0xabcde123456789012345678901234567890abcde'), 'evm');
  assert.strictEqual(AddressResolver.resolveAddressType('0xABCDE123456789012345678901234567890ABCDE'), 'evm');

  // Test Solana pubkey identification
  assert.strictEqual(AddressResolver.resolveAddressType('So11111111111111111111111111111111111111112'), 'solana');

  // Test invalid formats
  assert.strictEqual(AddressResolver.resolveAddressType('not_an_address'), 'unknown');
  assert.strictEqual(AddressResolver.resolveAddressType('0xinvalidLength'), 'unknown');
});

test('Milestone 4: Cross-Chain Bridge Tracker and Link Resolution', () => {
  const tracker = new BridgeTracker();
  
  // Trace a receiver funded by Across bridge
  const receiverAddress = 'So11111111111111111111111111111111111111112';
  const bridgeTx = tracker.traceFundingSource(receiverAddress, 'solana');
  
  assert.ok(bridgeTx !== undefined);
  assert.strictEqual(bridgeTx.bridgeName, 'Across');
  assert.strictEqual(bridgeTx.sourceChainId, '1'); // Funded from Ethereum Mainnet
  assert.strictEqual(bridgeTx.sourceAddress, '0xevm_sender_address_abc123'); // Origin EOA address
  assert.strictEqual(bridgeTx.targetAddress, receiverAddress);
});

test('Milestone 4: Cross-Chain Wallet DNA Reputation Cache', () => {
  const cache = new CrossChainReputationCache();

  // Query wallet DNA for EVM address
  const evmDna = cache.getUnifiedWalletDNA('0xevm_sender_address_abc123');
  assert.strictEqual(evmDna.reputationTags.includes('SERIAL_RUGGER'), true);
  assert.strictEqual(evmDna.reputationTags.includes('INSIDER_DEPLOYMENT'), true);

  // Query wallet DNA for receiver address
  const solDna = cache.getUnifiedWalletDNA('So11111111111111111111111111111111111111112');
  assert.strictEqual(solDna.reputationTags.length, 0);

  console.log('✅ Milestone 4: All cross-chain resolution and reputation tests passed successfully!');
});
