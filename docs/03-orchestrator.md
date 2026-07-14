# Orchestrator Agent Specification

The **Orchestrator Agent** is responsible for managing incoming transaction buffers, pipeline execution order, and coordinate step updates.

## Role Responsibilities
1. **Transaction Capture**: Listens to the incoming transaction streams (Helius WebSocket for Solana, Alchemy log feeds for EVM) and decodes transactions.
2. **Buffer Coordination**: Tracks the trade counter for each token in Redis.
3. **Queue Dispatch**: Triggers BullMQ jobs once early trade thresholds are reached or when the 15-minute timeout is reached.
4. **State Machine Management**: Manages state transitions for active scans (e.g. `idle` -> `buffering` -> `enriching` -> `scoring` -> `completed`).

## Buffer Logic Schema
```typescript
interface IngestionBuffer {
  assetAddress: string;
  creator: string;
  socialsExist: boolean;
  trades: Array<{
    trader: string;
    quoteAmount: number; // e.g. SOL, ETH, or USDG
    tokenAmount: number;
    blockNumber: number; // or slot
    signature: string;
    timestamp: number;
  }>;
  count: number;
  createdAt: number;
}
```

## Key State Transitions
* **On Token Create Event**:
  Initialize a Redis hash key `nocap:buffer:${assetAddress}` with creation metadata.
* **On Trade Event**:
  Append trade data to `nocap:buffer:${assetAddress}:trades`. Increment `count`. If `count === 20`, immediately transition state to `enriching` and push to queue.
* **On Tick (Timeout Monitor)**:
  A periodic Redis check verifies if `now - createdAt >= 900` (15 minutes) for any active buffers. If yes, transition state to `enriching` and push to queue.
