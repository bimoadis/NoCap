import { pgTable, varchar, timestamp, boolean, integer, doublePrecision, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const regimeConfigs = pgTable('regime_configs', {
  regimeVersion: varchar('regime_version', { length: 50 }).primaryKey(),
  maxParentShare: doublePrecision('max_parent_share').notNull(),
  maxFreshWalletRatio: doublePrecision('max_fresh_wallet_ratio').notNull(),
  maxBlockTrades: integer('max_block_trades').notNull(),
  maxSizeUniformity: doublePrecision('max_size_uniformity').notNull(),
  maxDevLaunchesDead: doublePrecision('max_dev_launches_dead').notNull(),
  minDevHoldSol: doublePrecision('min_dev_hold_sol').notNull(),
  maxBadOverlapCount: integer('max_bad_overlap_count').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const walletProfiles = pgTable('wallet_profiles', {
  address: varchar('address', { length: 44 }).primaryKey(),
  firstTxTimestamp: timestamp('first_tx_timestamp'),
  txCount: integer('tx_count').default(0).notNull(),
  lastFunder: varchar('last_funder', { length: 44 }),
  funderType: varchar('funder_type', { length: 50 }).default('unknown').notNull(), // 'deployer' | 'cex' | 'organic_buyer' | 'unknown'
  reputationFlags: jsonb('reputation_flags').default([]).notNull(), // string[]
  launches: integer('launches').default(0).notNull(),
  deadUnder10m: integer('dead_under_10m').default(0).notNull(),
  avgExtractionSol: doublePrecision('avg_extraction_sol').default(0.0).notNull(),
  fundedSnipers: integer('funded_snipers').default(0).notNull(),
  cluster: varchar('cluster', { length: 50 }),
  trust: doublePrecision('trust').default(1.0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const predictions = pgTable('predictions', {
  chainId: varchar('chain_id', { length: 50 }).default('solana').notNull(),
  mint: varchar('mint', { length: 44 }).notNull(),
  verdict: varchar('verdict', { length: 20 }).notNull(), // 'CAP' | 'NO CAP'
  confidence: doublePrecision('confidence').notNull(),
  subclass: varchar('subclass', { length: 50 }).notNull(), // 'extraction' | 'organic' | 'coordinated'
  reasons: jsonb('reasons').notNull(), // Array<{code: string, text: string, severity: string}>
  features: jsonb('features').notNull(), // JSON snapshot of computed features
  uaimDocument: jsonb('uaim_document'), // Store complete UAIM structure
  regimeVersion: varchar('regime_version', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.chainId, table.mint] })
  };
});

export const outcomes = pgTable('outcomes', {
  chainId: varchar('chain_id', { length: 50 }).default('solana').notNull(),
  mint: varchar('mint', { length: 44 }).notNull(),
  rug30m: boolean('rug_30m').default(false).notNull(),
  dead24h: boolean('dead_24h').default(false).notNull(),
  alive24h: boolean('alive_24h').default(false).notNull(),
  graduated: boolean('graduated').default(false).notNull(),
  peakPriceSol: doublePrecision('peak_price_sol').default(0.0).notNull(),
  exitMetrics: jsonb('exit_metrics').default({}).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.chainId, table.mint] })
  };
});

export const walletSessions = pgTable('wallet_sessions', {
  wallet: varchar('wallet', { length: 44 }).primaryKey(),
  connected: boolean('connected').default(false).notNull(),
  access: boolean('access').default(false).notNull(),
  accessUntil: integer('access_until').default(0).notNull(),
  spins: integer('spins').default(0).notNull(),
  burns: integer('burns').default(0).notNull(),
  freeScans: integer('free_scans').default(3).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bridgeTransactions = pgTable('bridge_transactions', {
  txHash: varchar('tx_hash', { length: 66 }).primaryKey(),
  bridgeName: varchar('bridge_name', { length: 50 }).notNull(),
  sourceChainId: varchar('source_chain_id', { length: 20 }).notNull(),
  sourceAddress: varchar('source_address', { length: 64 }).notNull(),
  targetChainId: varchar('target_chain_id', { length: 20 }).notNull(),
  targetAddress: varchar('target_address', { length: 64 }).notNull(),
  amount: varchar('amount', { length: 78 }).notNull(), // Large integer values as string to prevent overflow
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const riskRules = pgTable('risk_rules', {
  code: varchar('code', { length: 50 }).primaryKey(),
  severity: varchar('severity', { length: 10 }).notNull(),
  condition: jsonb('condition').notNull(),
  message: varchar('message', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

