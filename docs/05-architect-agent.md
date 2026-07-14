# Architect Agent Specification

The **Architect Agent** maintains monorepo organization, database schemas, package configurations, and API interfaces.

## Role Responsibilities
1. **Repository Layout Compliance**: Enforces modular decoupling between the shared package layers and app entrypoints.
2. **Schema Integrity**: Oversees schema changes, database migrations, indexes, and connections limits.
3. **API Contracts Enforcement**: Ensures route contracts align exactly with specifications to ensure compatibility with client web layers.

## Package Dependencies Layout
```
                  [apps/api]  [apps/telegram]  [apps/extension]
                        \            |            /
                      [core]  [engine]  [services/worker]
                        \            |            /
                          [models/database]
```

## Modular Package Roles
* **`models/database`**:
  Exposes the database connection pool client and table schemas using Drizzle ORM.
* **`core/` & `engine/`**:
  Contains rules calculation engines, adapter interfaces, orchestrator logic, and narrative/scoring utilities. Intentionally kept chain-agnostic.
* **`chains/`**:
  Contains blockchain-specific client wrappers (EVM & Solana) and implementation adapters.
