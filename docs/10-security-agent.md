# Security Agent Specification

The **Security Agent** ensures the safety of backend systems, handles API rate-limiting rules, and manages configuration security.

## Role Responsibilities
1. **API Keys Authentication**: Validates client access tokens and routes queries according to tier limits.
2. **Scoring Confidentiality**: Prevents leakages of exact thresholds or rule weights to public documentation.
3. **Endpoint Rate Limiting**: Establishes protection parameters against DDoS and wallet querying loops.

## Secrets & Environmental Values
The following parameters must be loaded securely and never hardcoded or pushed to repository logs:
* `HELIUS_API_KEY`: Connection token to access Helius data feeds.
* `DATABASE_URL`: Connection string containing Postgres credentials.
* `REDIS_URL`: Connection URL accessing cached data storage.
* `TG_BOT_TOKEN`: Token key validating Grammy bot commands.

## Rate Limiting Matrix
* **Public Endpoints (`/embed`, `/v1/metrics/public`)**: Maximum 120 queries per IP per minute.
* **Scan Endpoint (`POST /v1/scan`)**: Requires key-based authentication with customized tier limitations.
