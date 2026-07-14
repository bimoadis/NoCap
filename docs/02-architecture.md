# System Architecture

The NOCAP pipeline is built for high speed and predictable scaling under heavy launch volume.

```
[Inbound Stream] ──> Ingestor (Helius WS / EVM logs) ──> Token Buffer
                                                          │
                                                Enrichment Worker Pool
                                                          │
                                             ┌────────────▼────────────┐
                                             │  Orchestrator Registry  │
                                             └──────┬───────────┬──────┘
                                                    │           │
                                       solana/adapters  robinhood/adapters
                                                    │           │
                                             ┌──────▼───────────▼──────┐
                                             │      UAIM Parser        │
                                             └────────────┬────────────┘
                                                          │
                                                   Risk/Scoring/AI
                                                          │
                                                    Postgres & SSE
```

## 1. Ingestion Layer
* **Multi-Chain Streams**: Subscribes to Helius WebSockets for Solana (Pump.fun) and EVM log filters for Robinhood Chain (`hood.fun`/`NOXA` event signatures via Alchemy feed).
* **Buffer Queue**: Ingests transactions and routes them to Redis-based buffer keys per token.
* **Timeout Manager**: Triggers evaluation when trade thresholds are met or a maximum timeout occurs, pushing the token to the BullMQ enrichment queue.

## 2. Enrichment Worker Pool & Orchestrator
* **Capability Router**: The core orchestrator queries the `Chain Registry` to find active adapters and capabilities for the target token's `chainId`.
* **Parallel Ports & Adapters**: Calls active adapters (e.g. `ChainClient`, `Explorer`, `Dex`, `LaunchSource`, `Wallet`, `Probe`) in parallel.
* **Cache Resolver**: Prevents duplicate RPC requests by checking Redis and Postgres cache.

## 3. Scorer & Engine
* Evaluates rule weights using parameters fetched from the active `regime_configs` table.
* Writes a record to the `predictions` table containing a full snapshot of the calculated features.

## 4. Output Handlers
* **SSE Stream**: Publishes progress updates to clients during enrichment steps.
* **Telegram Bot Listener**: Processes command queries and displays the score outputs.
* **Embed Server**: Renders a lightweight HTML iframe containing real-time stream subscription scripts.

## 5. Outcome Oracle (Cron)
* Evaluates historical performance.
* Updates prediction outcome metrics (e.g. graduated, rug, alive) and updates precision statistics.
