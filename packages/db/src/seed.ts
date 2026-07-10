import { db, pool, regimeConfigs, walletProfiles } from './client.js';

async function seed() {
  console.log('Seeding database...');
  try {
    // 1. Seed regime configs
    await db.insert(regimeConfigs).values({
      regimeVersion: 'REGIME W14',
      maxParentShare: 0.40, // 40%
      maxFreshWalletRatio: 0.50, // 50%
      maxBlockTrades: 5,
      maxSizeUniformity: 0.05, // Standard deviation in SOL
      maxDevLaunchesDead: 0.70, // 70%
      minDevHoldSol: 0.5,
      maxBadOverlapCount: 2,
      isActive: true,
    }).onConflictDoNothing();

    // 2. Seed some known mock wallet profiles
    const walletsToInsert = [
      {
        address: '7xKpA2q93oWpL4sKmZrT5eYpWqFvNuXyL7zK9aA71', // Deployer mockup
        txCount: 148,
        funderType: 'deployer',
        reputationFlags: ['serial_deployer', 'rug_creator'],
        launches: 48,
        deadUnder10m: 46,
        avgExtractionSol: 31.4,
        fundedSnipers: 112,
        trust: 0.04,
      },
      {
        address: '3mVcA71pWqFvNuXyL7zK9aA719xUwL4sKmZrT5eYp', // Sniper mockup
        txCount: 420,
        funderType: 'deployer',
        reputationFlags: ['known_sniper'],
        launches: 0,
        deadUnder10m: 0,
        avgExtractionSol: 0.0,
        fundedSnipers: 0,
        trust: 0.09,
      },
      {
        address: '5nGaJJ3tWpL4sKmZrT5eYpWqFvNuXyL7zK9aA71pW', // CEX wallet mockup
        txCount: 85293,
        funderType: 'cex',
        reputationFlags: ['cex_hot_wallet'],
        launches: 0,
        deadUnder10m: 0,
        avgExtractionSol: 0.0,
        fundedSnipers: 0,
        trust: 0.40,
      }
    ];

    for (const w of walletsToInsert) {
      await db.insert(walletProfiles).values({
        address: w.address,
        firstTxTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        txCount: w.txCount,
        funderType: w.funderType,
        reputationFlags: w.reputationFlags,
        launches: w.launches,
        deadUnder10m: w.deadUnder10m,
        avgExtractionSol: w.avgExtractionSol,
        fundedSnipers: w.fundedSnipers,
        trust: w.trust,
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
