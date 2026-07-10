# Testing Standards

This document establishes the testing standards to ensure the accuracy of rule evaluations and the reliability of scan workflows.

## 1. Core Engine Unit Testing
* Target: Features calculation logic in `packages/core`.
* Rules calculation logic must be tested against **static mock fixtures** (e.g. pre-saved JSON logs of real Pump.fun launches).
* Avoid triggering live RPC connections inside test scripts. Mock connections to return predictable outputs for target addresses.

## 2. Test Structure Template
```typescript
import { calculateSizeUniformity } from '../src/engine/features';

describe('Feature: Size Uniformity', () => {
  it('should flag uniform buy sizes as highly suspicious', () => {
    // uniform mock trades (0.1 SOL each)
    const uniformTrades = Array(20).fill({ solAmount: 0.1 });
    const stdDev = calculateSizeUniformity(uniformTrades);
    expect(stdDev).toBeLessThan(0.001); // Standard deviation close to zero
  });

  it('should pass organic variable sizes', () => {
    const variedTrades = [0.1, 1.2, 0.5, 4.0, 0.2, 0.8].map(sol => ({ solAmount: sol }));
    const stdDev = calculateSizeUniformity(variedTrades);
    expect(stdDev).toBeGreaterThan(0.5);
  });
});
```

## 3. Coverage Targets
* **Engine calculations (`packages/core/src/engine`)**: Minimum test coverage of **95%**.
* **API Route Handlers (`apps/api`)**: Minimum test coverage of **80%**.
