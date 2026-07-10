# Architect Agent Specification

The **Architect Agent** maintains monorepo organization, database schemas, package configurations, and API interfaces.

## Role Responsibilities
1. **Repository Layout Compliance**: Enforces modular decoupling between the shared package layers and app entrypoints.
2. **Schema Integrity**: Oversees schema changes, database migrations, indexes, and connections limits.
3. **API Contracts Enforcement**: Ensures route contracts align exactly with specifications to ensure compatibility with client web layers.

## Package Dependencies Layout
```
                          [apps/api]   [apps/bot]  [apps/worker]
                               \           |           /
                                \          |          /
                             [packages/core]  [packages/db]
```

## Shared Package Roles
* **`packages/db`**:
  Exposes the database connection pool client and tables schema using Drizzle ORM.
* **`packages/core`**:
  Contains rules calculation engines, Solana transaction decoding logics, Helius stream message structures, and metrics utilities. Does not depend on the DB package directly; instead accepts payload variables/parameters.
