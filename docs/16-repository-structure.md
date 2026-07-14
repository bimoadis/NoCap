# Repository Structure

NOCAP uses a monorepo structure managed by `pnpm` workspaces to keep modules decoupled while sharing database models and core engine definitions.

## Monorepo Layout Map
```text
nocap/
├── apps/
│   ├── web/                     # Frontend UI (renders UAIM only)
│   ├── telegram/                # Telegram bot interface
│   ├── extension/               # Browser overlay extension
│   └── api/                     # Fastify REST & SSE Server
│
├── chains/                      # Encapsulated blockchain-specific code
│   ├── solana/
│   │   ├── client/              # RPC & WebSocket trace subscriber
│   │   └── adapters/            # Implementations of core ports (DEX, Explorer, Launchpad)
│   ├── robinhood/
│   │   ├── client/              # JSON-RPC, log subscription, & simulation client
│   │   └── adapters/            # Implementations of core ports (Uni v3, hood.fun, bridges)
│   └── _evm-common/             # Shared EVM logic (reused by Robinhood, Base, Ethereum)
│
├── core/                        # System orchestration & gateway logic (Chain-Agnostic)
│   ├── orchestrator/            # Parallel fetch plan generator
│   ├── registry/                # Chain adapter registry & capability flag manager
│   └── cache/                   # Redis cache wrappers
│
├── engine/                      # Core analysis engines (Chain-Agnostic)
│   ├── risk/                    # Rules engine evaluating UAIM risks
│   ├── scoring/                 # Verdict calibration & final score engine
│   └── narrative/               # AI context builder & prompt engine
│
├── models/                      # Universal data contracts
│   ├── uaim/                    # Versioned UAIM schema & types
│   └── database/                # Drizzle ORM schema & Postgres definitions
│
├── plugins/                     # Hot-reloadable rules & prompt templates
│   ├── risk-rules/              # JSON logic risk definitions
│   └── ai-prompts/              # LLM system & explainer templates
│
├── services/                    # Daemons & background workers
│   ├── indexer/                 # SQD / Subgraph stream consumers
│   └── worker/                  # BullMQ enrichment & outcome oracle cron
│
└── shared/                      # Low-level utilities
    ├── utils/                   # General helper functions
    └── constants/               # Global constants
```
