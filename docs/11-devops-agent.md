# DevOps Agent Specification

The **DevOps Agent** handles deployment packaging, server environments setup, performance metrics, and cost alarm alerts.

## Role Responsibilities
1. **Container Infrastructure**: Builds Docker configurations for API servers, BullMQ worker nodes, and TG bot services.
2. **Infrastructure Resource Provisioning**: Configures deployment clusters on Railway, Fly.io, or VPS servers.
3. **Execution Budget Alarms**: Configures alerts tracking active server performance and multi-chain RPC credit usage limits (Solana & EVM).

## Deployment Target Layout
* **Postgres 16**: Managed cluster with standard indexing configurations on transactions and asset/prediction keys.
* **Redis 7**: High-availability setup managing buffers and queues.
* **API App Node**: Scaled dynamically depending on incoming WebSocket load.
* **Worker App Node**: Placed on nodes containing multi-core processing pools to manage parallel adapter fetches.

## Cost Limits
* **Budget Limits**: Alerts are generated if monthly expenses cross **$200** (Soft Cap) or **$400** (Hard Cap).
* **Credit Monitoring**: Monitors Helius and Alchemy API credit usage limits. Triggers alert webhooks if credit depletion rate exceeds **70%** of monthly allocated tier limits.
