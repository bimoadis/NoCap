# System Overview

NOCAP is a modular, real-time wallet and token intelligence infrastructure layer designed to analyze token launches across multiple blockchains, starting with Solana (Pump.fun) and expanding to Robinhood Chain (hood.fun, NOXA, and tokenized Stock Tokens).

## Core Concept
Instead of rendering complex charts or heavy analytical dashboards, NOCAP outputs a single verdict: **CAP** (indicating a bundled extraction setup where a single entity dominates the supply) or **NO CAP** (organic trading behavior).

Every verdict is delivered alongside a confidence score (from 0 to 1) and a clear, human-readable reason detailing the verdict criteria, generated in a chain-agnostic manner.

## Scope & Priority Matrix

| Priority | Scope | Features / Deliverables |
|---|---|---|
| **P0** | Ingestion & Core Scorer | Modular ingestion pipelines, cross-chain funding tracers, rule-based features engine, verdict API (Fastify REST + SSE stream), prediction history logs, and outcome oracle cron. |
| **P1** | User Surfaces | Telegram bot, embeddable iframe widget, wallet profile search endpoint, and a public accuracy metrics page. |
| **P2** | Distribution & Tooling | Chrome extension (read-only injects), automatic X reply bot, and regime recalibration/shadow mode testing tools. |

## Feature Engine Matrix (Rule-Based)

The system computes 8 core rules for each scan:

1. **`funding_parent_share`**: Percentage of the early buyers (e.g. first 20) funded by a single parent wallet.
2. **`deployer_funded`**: Detects if buyers are funded directly or 1-hop by the developer wallet.
3. **`same_block_count`**: Number of buys occurring in the exact same slot/block/second as token creation.
4. **`size_uniformity`**: Standard deviation of buy sizes in quote assets (SOL/ETH/USDG) (uniform sizes are strong indicators of bots).
5. **`fresh_wallet_ratio`**: Ratio of buyers whose wallets are under 24 hours old (or resolved bridge provenance age).
6. **`dev_history`**: History of the deployer wallet (prior launches, % dead < 10m, time since last rug).
7. **`dev_commitment`**: Whether the developer wallet holds its buy at early trade thresholds, and presence of metadata socials.
8. **`known_bad_overlap`**: Buyers with history linked to previous extraction/rug tokens.

## Verdict Outputs
* **CAP** (`extraction`): Strong cluster funding signatures and uniform buyer patterns indicate single-entity supply dominance.
* **NO CAP** (`organic`): Distributed funding, natural variance in size, and non-suspicious deployer actions.
* **NO CAP (Coordinated)**: Group/coordinated buys but without hostile extraction patterns (dev remains committed). For version 1, this maps to **NO CAP** with a warning flag.
