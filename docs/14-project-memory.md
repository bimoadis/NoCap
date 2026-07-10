# Project Memory & Caching Strategy

NOCAP uses a dual-layer caching strategy (Redis and Postgres) to minimize Solana RPC query costs and speed up verdict calculations.

## 1. Caching Levels
* **L1 Cache (Redis)**: Rapid query cache (TTL: 24 hours). Used to store temporary transaction buffers and active scan progress.
* **L2 Cache (Postgres `wallet_profiles`)**: Semi-permanent storage. Holds historical profiles of creators and traders.

## 2. Wallet Profile Indexing Schema
```typescript
interface CachedWalletProfile {
  address: string;
  first_tx_timestamp: number;
  tx_count: number;
  last_funder: string;
  funder_type: 'deployer' | 'cex' | 'organic_buyer' | 'unknown';
  reputation_flags: string[]; // e.g. ["known_sniper", "rug_participant"]
  trust_score: number;        // confidence scale (0.0 to 1.0)
  updated_at: Date;
}
```

## 3. Cache Warming Rules
* When a scan processes, new profile information is inserted or incrementally updated in Postgres.
* If a wallet address is searched again within 24 hours, the data is retrieved directly from Redis, preventing redundant Solana RPC lookups.
* **Biweekly Sync**: A background task updates transaction counts and active status for flagged bad-actor wallets.
