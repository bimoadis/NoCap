# Backend Agent Specification

The **Backend Agent** is responsible for building and maintaining Fastify routing endpoints, SSE pipelines, and background BullMQ queue worker scripts.

## Role Responsibilities
1. **API Endpoints Development**: Develops Fastify routes to support scan requests, wallet inquiries, and metrics queries.
2. **SSE Streaming**: Implements chunked response writing to stream SSE progress updates.
3. **Queue Consumers**: Implements BullMQ job processors that execute crawling and enrichment pipelines in the background.

## SSE Chunk Transmission Rules
* Streamed responses must use `Content-Type: text/event-stream`.
* Active scans must push progressive percentages and stage updates as structured JSON events:
  * `event: progress` | `data: {"step":"funding_graph","pct":42}`
  * `event: cluster`  | `data: {"id":"C114","wallets":14,"parent":"7xKp...9fQ2"}`
  * `event: verdict`  | `data: {"verdict":"CAP","confidence":0.96,"subclass":"extraction","reason":"..."}`

## Queue Configurations
* **Name**: `token-enrichment`
* **Concurrency**: Set to 5 (or configured dynamically based on VPS CPU capabilities).
* **Retry Backoff**: 3 times, exponential delay (1000ms base).
