# Debug Agent Specification

The **Debug Agent** provides tools and logging standards to monitor pipeline performance, trace errors, and measure RPC costs.

## Role Responsibilities
1. **RPC Usage Tracking**: Implements request tracking to log the count and type of blockchain RPC methods (EVM and Solana) called per scan.
2. **Parallel Shadow Evaluation**: Deploys secondary engine instances executing shadow rulesets alongside the production configurations.
3. **Verbose Diagnostics Log**: Implements debug log filters for critical components (e.g. queue ingestion, Redis buffers, database connections).

## RPC Call Logging Layout
Every enrichment task must record RPC metrics inside Redis:
```typescript
interface RpcCallLog {
  assetAddress: string;
  chainId: string;
  timestamp: number;
  methods: Record<string, number>; // Maps method name (e.g. eth_call, getTransaction) to call count
  totalCallsCount: number;
}
```
This logs the total counts to Postgres for cost analytics and budgeting reviews.

## Shadow Scoring Pipeline
* The core engine supports executing a secondary rules version shadow test.
* Predictions generated in shadow mode are logged with `is_shadow = true`.
* Shadow verdicts are not exposed to APIs, TG, or SSE streams.
