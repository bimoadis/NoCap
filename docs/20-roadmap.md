# Project Roadmap & Milestones

This document details the development milestones and operational targets for NOCAP backend deployment.

```
 M1: Core Pipeline     M2: Loop & Metrics     M3: Public Surfaces     M4: External APIs
┌─────────────────┐   ┌──────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ Ingestion,      │   │ Outcome Oracle,  │   │ Telegram Bot,     │   │ External Keys,    │
│ Scorer Scans,   │──>│ Accuracy Metrics,│──>│ Public Accuracy   │──>│ Iframe embeds,    │
│ Postgres logs   │   │ shadow execution │   │ page live         │   │ partner APIs      │
└─────────────────┘   └──────────────────┘   └───────────────────┘   └───────────────────┘
```

## Milestone 1: Core Scan Pipeline (M1)
* **Goal**: Process a token address end-to-end, parse trades, perform funding traces, and output a verdict.
* **Definition of Done (DoD)**:
  * Ingests 20 trade events from mock or real WebSocket sources.
  * Resolves funding parent relationships within 3 hops.
  * Calculates feature outputs and inserts verdict results to the database.
  * The response time is under **15 seconds** for warm caches.

## Milestone 2: Self-Improving Loop & Shadow Mode (M2)
* **Goal**: Automate performance logging and evaluate rules accuracy.
* **Definition of Done (DoD)**:
  * The Outcome Oracle cron executes every 5 minutes.
  * Correctly labels token predictions at the 30-minute and 24-hour mark.
  * Populates accuracy statistics and displays performance on the public metrics endpoint.
  * Supports shadow mode ruleset execution.

## Milestone 3: TG Bot & Accuracy Portal (M3)
* **Goal**: Launch consumer interfaces.
* **Definition of Done (DoD)**:
  * Telegram bot handles address queries and responds with verdicts and confidence levels.
  * The public accuracy page renders performance statistics based on Oracle data.

## Milestone 4: External Integrations & SDK (M4)
* **Goal**: Open API services to third-party integrations.
* **Definition of Done (DoD)**:
  * Exposes secure REST endpoints with rate limiting and key-based access controls.
  * Embedded `/embed` widgets render cleanly inside third-party iframe slots.

---

## Milestone 5: Solana Consolidation (M5)
* **Goal**: Refactor the current Solana codebase to implement internal Ports & Adapters interfaces and output normalized UAIM documents.
* **Definition of Done (DoD)**:
  * Existing Solana pipelines compile and pass tests.
  * Zero regression on existing Solana API endpoints.
  * Scan outputs conform to UAIM schema.

## Milestone 6: Universal Engine & Extraction (M6)
* **Goal**: Isolate all chain-agnostic modules (Risk rules, Scoring calibrators, Narrative templates, AI explainer) into `/shared`, creating a strictly decoupled engine.
* **Definition of Done (DoD)**:
  * All shared logic is isolated in `/shared`.
  * A stub/mock chain adapter can be loaded via the registry and run without modifications to `/shared`.

## Milestone 7: Robinhood Chain Adapter Family (M7)
* **Goal**: Implement the Robinhood Chain EVM integration to scan meme tokens and flag impersonated Stock Tokens.
* **Definition of Done (DoD)**:
  * Users can input a Robinhood Chain `0x` token address and receive a full UAIM-compliant intelligence report.
  * Fake Stock Tokens are successfully flagged.

## Milestone 8: Cross-Chain Reputations & Bridge Resolution (M8)
* **Goal**: Build bridge tracing to link week-one Robinhood Wallet identities with historic Solana/Ethereum addresses.
* **Definition of Done (DoD)**:
  * Funding trace runs across bridges to trace origin wallets.
  * The UI/API shows unified multi-chain wallet footprints.

## Milestone 9: AI Portfolio & Agent Surfaces (M9)
* **Goal**: Package NoCap intelligence as a machine-readable safety oracle for autonomous agents and portfolios.
* **Definition of Done (DoD)**:
  * Third-party AI agents can programmatically query token risks using MCP or paying USDG.

