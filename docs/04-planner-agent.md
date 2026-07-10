# Planner Agent Specification

The **Planner Agent** manages rules orchestration, regime configs, and verdict confidence formulas.

## Role Responsibilities
1. **Rule Logic Enforcement**: Computes the values for each of the 8 features based on gathered profiles and trades.
2. **Dynamic Threshold Evaluation**: Loads threshold values from the active `regime_configs` table in the database.
3. **Verdicts Execution**: Computes the final confidence rating and maps it to `extraction` (CAP) or `organic` (NO CAP).

## Calibration Coefficients (Dynamic Schema)
These parameters are stored in the DB and are cached by the engine:
* `max_parent_share`: Threshold percentage above which `funding_parent_share` raises a flag.
* `max_fresh_wallet_ratio`: Threshold for the ratio of fresh wallets.
* `max_block_trades`: Maximum expected trades in the launch block under organic scenarios.
* `max_size_uniformity`: Standard deviation cutoff in SOL for detecting bot clusters.

## Verdict Evaluation Flow
```typescript
interface ScorerVerdict {
  verdict: 'CAP' | 'NO CAP';
  subclass: 'extraction' | 'organic' | 'coordinated';
  confidence: number;
  reasons: Array<{
    code: string;
    text: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}
```

The confidence score is computed as a weighted combination of the 8 feature flags. If the weighted sum exceeds the active `regime_threshold`, the token is flagged as **CAP**. Otherwise, it resolves to **NO CAP**.
