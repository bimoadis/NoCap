# Project Rules & Development Guidelines

This document outlines the strict guidelines and constraints for developers and agent processes building NOCAP.

## Technical Stack Constraints
* **Monorepo Manager**: `pnpm` workspaces (do not use raw npm or yarn).
* **Runtime**: Node.js v20.x (LTS) with Strict TypeScript.
* **API framework**: Fastify v4.x.
* **Database & ORM**: PostgreSQL v16 with Drizzle ORM.
* **Queues & Cache**: Redis v7 with BullMQ.
* **Telegram Bot**: Grammy framework.

## Product Boundaries & Non-Goals (v1)
> [!WARNING]
> Do NOT implement any of the following for the version 1 MVP:
> * Machine Learning (ML) or Deep Learning models (all features must be rule-based).
> * Auto-trading execution engines or native project tokens.
> * Mobile applications.

## Config & Threshold Calibration Rules
* **No Hardcoded Thresholds**: All rules threshold coefficients (e.g., standard deviation sizes, minimum token ages, holding thresholds) must be loaded dynamically from the `regime_configs` database table.
* **Regime Versioning**: Predictions must always capture the version of the regime config used during verification (e.g., `REGIME W14`).
* **Hot reloading**: Changes to thresholds in the database must hot-reload without restarting the worker processes or API services.

## Operational & Cost Guardrails
* **RPC Optimization**: All wallet crawls and historical trace crawls must be aggressively cached in Redis (with fallback to Postgres `wallet_profiles`).
* **Cost Limits**: Keep RPC calls to a minimum. Log the absolute count of RPC calls per mint scan to enforce the $200-$400/month project budget. Trigger Slack/Discord webhook warnings if Helius credit usage exceeds 70%.
