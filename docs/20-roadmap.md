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
