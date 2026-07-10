# Deployment & Infrastructure Plan

This document outlines deployment configurations, container layouts, and runtime environment settings.

## 1. Container Infrastructure Layout (Docker)
We use Docker configurations to build production packages.
* **Base Image**: `node:20-alpine` (for small size footprints).
* **Target Build**: Monorepo target scopes are isolated using pnpm build configurations:
  ```dockerfile
  FROM node:20-alpine AS base
  RUN npm i -g pnpm
  WORKDIR /app
  COPY . .
  RUN pnpm install --frozen-lockfile
  RUN pnpm --filter @nocap/api build
  ```

## 2. Platform Targets
* **Fastify API Server**: Deployed on Railway or Fly.io (autoscaled based on CPU loads).
* **BullMQ Enrichment Workers**: Deployed on dedicated VPS nodes to avoid latency issues from memory exhaustion.
* **Redis Cache**: Managed Redis database instance with a memory limit of at least 4GB. Set eviction policy to `volatile-lru`.

## 3. Environment Variables Settings

The following variables must be configured on deployment targets:

| Variable | Description | Required In |
|---|---|---|
| `NODE_ENV` | Mode setting (`production` / `development`) | All |
| `HELIUS_API_KEY` | Helius API credentials for streaming and RPC queries | Worker |
| `DATABASE_URL` | Postgres pool connection url | API, Worker |
| `REDIS_URL` | Redis URL for BullMQ queues and L1 caching | API, Worker |
| `TG_BOT_TOKEN` | Token validating Telegram API access | Bot |
| `REGIME_VERSION` | Default configuration regime version (e.g. `W14`) | API, Worker |
