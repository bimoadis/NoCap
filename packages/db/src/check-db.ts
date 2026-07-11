import { db, predictions, walletSessions, walletProfiles, outcomes } from './client.js';

async function check() {
  try {
    console.log('Connecting to database...');
    const predRows = await db.select().from(predictions);
    const sessionRows = await db.select().from(walletSessions);
    const profileRows = await db.select().from(walletProfiles);
    const outcomeRows = await db.select().from(outcomes);

    console.log(`\n--- DATABASE STATE ---`);
    console.log(`Predictions: ${predRows.length} rows`);
    predRows.forEach(r => console.log(`  - Mint: ${r.mint}, Verdict: ${r.verdict}, Conf: ${r.confidence}, CreatedAt: ${r.createdAt}`));

    console.log(`\nWallet Sessions: ${sessionRows.length} rows`);
    sessionRows.forEach(r => console.log(`  - Wallet: ${r.wallet}, Connected: ${r.connected}, Spins: ${r.spins}, FreeScans: ${r.freeScans}`));

    console.log(`\nWallet Profiles: ${profileRows.length} rows`);
    profileRows.slice(0, 10).forEach(r => console.log(`  - Address: ${r.address}, FunderType: ${r.funderType}, Launches: ${r.launches}`));

    console.log(`\nOutcomes: ${outcomeRows.length} rows`);
    outcomeRows.forEach(r => console.log(`  - Mint: ${r.mint}, Rug30m: ${r.rug30m}`));

  } catch (e) {
    console.error('Error querying DB:', e);
  } finally {
    process.exit(0);
  }
}

check();
