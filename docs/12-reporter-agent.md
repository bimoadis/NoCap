# Reporter Agent Specification

The **Reporter Agent** runs the Outcome Oracle loop, computes system performance metrics, and updates accuracy logs.

## Role Responsibilities
1. **Outcome Evaluation Cron**: Queries chain-agnostic pricing feeds to evaluate predictions exactly 30 minutes and 24 hours after token launch.
2. **Metrics Updates**: Recalculates rolling 30-day precision, recall, and Brier calibration scores.
3. **Public API Service**: Exposes performance parameters to `/v1/metrics/public`.

## Outcome Evaluation Rules
The system evaluates outcomes based on these predefined criteria:
* **`rug_30m`**: Token price drops **90%+** from its peak within 30 minutes of launch, AND:
  * Deployer sells **50%+** of initial holdings, OR:
  * Flagged cluster members net sell **70%+** of combined holdings.
* **`dead_24h`**: Token volume or liquidity drops below configured limits after 24 hours.
* **`graduated`**: Bonding curve completes, and liquidity is migrated to the target AMM (e.g. Raydium or Uniswap v3).

## Public Metrics Cache Schema
Calculated metrics are stored in Postgres and cached in Redis for fast rendering on the public accuracy page:
```typescript
interface PublicPerformanceMetrics {
  totalVerdictsCount: number;
  capPrecision: number;     // target: >90%
  capRecall: number;
  brierScore: number;       // measures calibration quality
  medianVerdictTimeMs: number;
}
```
All outcomes, including system errors/misses, must be published openly.
