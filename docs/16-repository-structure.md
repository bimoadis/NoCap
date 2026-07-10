# Repository Structure

NOCAP uses a monorepo structure managed by `pnpm` workspaces to keep modules decoupled while sharing database models and core engine definitions.

## Monorepo Layout Map
```text
nocap/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── docs/                      # Technical specification documents
├── apps/
│   ├── api/                   # Fastify REST Server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts      # Fastify server bootstrapper
│   │       └── routes/        # Route handlers (scan, wallet, embed, metrics)
│   ├── worker/                # BullMQ Queue ingestion & crawlers
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── ingestor.ts    # Helius WebSocket subscriber
│   │       ├── enrichment.ts  # Wallet trace worker
│   │       └── cron/
│   │           └── oracle.ts  # Outcome calculations scheduler
│   └── bot/                   # Grammy Telegram bot app
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── bot.ts         # Telegram bot interface
└── packages/
    ├── db/                    # Shared Drizzle database access
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── client.ts      # Postgres client pool export
    │       └── schema.ts      # Drizzle database schemas
    └── core/                  # Engine logic, decoders & feature functions
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── engine/
            │   ├── features.ts # 8 features formulas
            │   └── scorer.ts   # Scorer and verdict evaluation
            └── parser/
                └── pump.ts    # Pump.fun logs decoders
```
