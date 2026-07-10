# System Architecture

The NOCAP pipeline is built for high speed and predictable scaling under heavy launch volume.

```
Helius stream ──> ingestor ──> token buffer (20 trade first)
                                    │
                               enrichment workers
                        (wallet profile + funding 1 hop, cached)
                                    │
                               feature engine ──> scorer ──> verdict
                                    │                         │
                               Postgres (prediction log)   SSE / API / bot
                                    │
                             outcome oracle (cron) ──> metrics publik
```

## 1. Ingestion Layer
* **Enhanced WebSockets**: Subscribes to the Pump.fun Program ID (`6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`) on Helius.
* **Buffer Queue**: Ingests transactions and routes them to Redis-based buffer keys.
* **Timeout Manager**: Watches the token buffer. If 20 trades are reached or a 15-minute timeout occurs, the token is pushed to the BullMQ enrichment queue.

## 2. Enrichment Worker Pool (BullMQ)
* **Job Scheduler**: Distributes evaluation checks across background workers.
* **Solana RPC Tracers**: Traces SOL transfer history for the developer and the 20 buyers.
* **Cache Resolver**: Queries Redis for pre-compiled wallet profiles to prevent duplicate RPC calls.

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
