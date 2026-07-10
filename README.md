# NOCAP · Know before you ape

NOCAP is a real-time wallet intelligence layer that monitors the first 20 trades of every launch on Pump.fun, traces funding sources, and delivers a quick verdict on whether the launch is **CAP** (bundled/extraction) or **NO CAP** (organic).

This repository contains the backend services, enrichment workers, API interfaces, and Telegram bot utilities.

## Documentation Index

Detailed documentation for the architecture, rules, and specifications can be found under the [docs/](file:///d:/Real%20Kerja/NoCap/docs/) directory:

### Core Specs & Rules
* [00-project-rules.md](file:///d:/Real%20Kerja/NoCap/docs/00-project-rules.md) - Project-wide guidelines, threshold management, and guardrails.
* [01-system-overview.md](file:///d:/Real%20Kerja/NoCap/docs/01-system-overview.md) - Product concept, scope boundaries, and priorities (P0-P2).
* [02-architecture.md](file:///d:/Real%20Kerja/NoCap/docs/02-architecture.md) - System design schema, Helius streams, BullMQ queues, and data store layout.

### Agent-Specific System Modules
* [03-orchestrator.md](file:///d:/Real%20Kerja/NoCap/docs/03-orchestrator.md) - Scan coordinator, buffering queues, and ingest pipeline.
* [04-planner-agent.md](file:///d:/Real%20Kerja/NoCap/docs/04-planner-agent.md) - Rule-based engine, features formulation, and regime versioning.
* [05-architect-agent.md](file:///d:/Real%20Kerja/NoCap/docs/05-architect-agent.md) - Monorepo packages layout, structural interfaces, and API contracts.
* [06-backend-agent.md](file:///d:/Real%20Kerja/NoCap/docs/06-backend-agent.md) - Fastify REST API, SSE stream protocols, and queue processors.
* [07-frontend-agent.md](file:///d:/Real%20Kerja/NoCap/docs/07-frontend-agent.md) - Iframe embed, widget integration, and script flows.
* [08-qa-agent.md](file:///d:/Real%20Kerja/NoCap/docs/08-qa-agent.md) - Testing workflows, rule calibration holdouts, and validation.
* [09-debug-agent.md](file:///d:/Real%20Kerja/NoCap/docs/09-debug-agent.md) - Log strategies, RPC counters, and diagnostic tools.
* [10-security-agent.md](file:///d:/Real%20Kerja/NoCap/docs/10-security-agent.md) - API key structures, rate limits, and threshold confidentiality.
* [11-devops-agent.md](file:///d:/Real%20Kerja/NoCap/docs/11-devops-agent.md) - Deployment, monitoring, cost configurations, and alerts.
* [12-reporter-agent.md](file:///d:/Real%20Kerja/NoCap/docs/12-reporter-agent.md) - Outcome oracle tracker and performance metrics logs.

### Collaboration & Protocols
* [13-agent-communication.md](file:///d:/Real%20Kerja/NoCap/docs/13-agent-communication.md) - Core API messaging, SSE schema details, and DB shared interfaces.
* [14-project-memory.md](file:///d:/Real%20Kerja/NoCap/docs/14-project-memory.md) - Caching policies (Redis/Postgres), profile updates, and database indexing.
* [15-workflow.md](file:///d:/Real%20Kerja/NoCap/docs/15-workflow.md) - Development workflow, code review milestones, and shadow mode deployments.

### Repository Standards
* [16-repository-structure.md](file:///d:/Real%20Kerja/NoCap/docs/16-repository-structure.md) - Monorepo paths and PNPM workspace settings.
* [17-coding-standard.md](file:///d:/Real%20Kerja/NoCap/docs/17-coding-standard.md) - TypeScript standard, Fastify plugin patterns, and error handling.
* [18-testing-standard.md](file:///d:/Real%20Kerja/NoCap/docs/18-testing-standard.md) - Test specs, rules engine unit tests, and regression logs.
* [19-deployment.md](file:///d:/Real%20Kerja/NoCap/docs/19-deployment.md) - Target deployments (VPS/Railway/Fly) and Docker environment settings.
* [20-roadmap.md](file:///d:/Real%20Kerja/NoCap/docs/20-roadmap.md) - Operational Milestones (M1 to M4).
