# Development & Release Workflows

This document defines the process for updating features, configuring regimes, and promoting updates to production.

## 1. Feature Development Steps
1. **Develop Rule**: Write target rule calculation logic in `packages/core`.
2. **Add Tests**: Create static transaction logs in test suites to verify rule calculations.
3. **Draft Configuration**: Add configuration coefficients for the new rule version in the database.

## 2. Regime Version Release Flow
> [!IMPORTANT]
> New rulesets and threshold configs must go through **Shadow Mode** before going live:
> 1. Set the new config version state to `shadow` in the database.
> 2. The pipeline will run both the production regime and the shadow regime concurrently.
> 3. Verify shadow mode predictions against actual token outcomes over a **14-day holdout evaluation period**.
> 4. Promote shadow version to `production` only if performance meets threshold targets (precision > 90%).

## 3. Database Migration Protocol
* All schema changes must be declared using Drizzle schema files in `packages/db`.
* Run migration generators to build database scripts:
  ```bash
  pnpm --filter @nocap/db db:generate
  pnpm --filter @nocap/db db:migrate
  ```
* Seed scripts must be updated to populate newly added configuration structures.
