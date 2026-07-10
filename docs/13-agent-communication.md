# Agent Communication & Protocols

This document defines how services communicate, trade event statuses, and database sharing structures.

## Ingestion to Buffer (Redis List & Hashes)
Websocket ingester pushes trades to a Redis list:
* Key: `nocap:buffer:${mint}:trades`
* Message Schema:
  ```json
  {
    "trader": "address",
    "side": "buy" | "sell",
    "sol_amount": 0.5,
    "token_amount": 100000,
    "slot": 12053422,
    "signature": "sig_hash",
    "timestamp": 1720584931
  }
  ```

## Ingester to Enrichment Worker (BullMQ Job)
When a buffer reaches 20 trades, a job is pushed to BullMQ:
* Queue: `token-enrichment`
* Data payload:
  ```json
  {
    "mint": "mint_address",
    "creator": "creator_address",
    "tradesCount": 20
  }
  ```

## Scan Server to Client (SSE Protocol)
API Scan route pushes updates to client listening handles.
Standard SSE sequence:
1. `event: progress` | `data: {"step":"deployer","pct":10}`
2. `event: progress` | `data: {"step":"buyers","pct":20}`
3. `event: progress` | `data: {"step":"funding_graph","pct":40}`
4. `event: cluster`  | `data: {"id":"C114","wallets":14,"parent":"7xKp...9fQ2"}`
5. `event: progress` | `data: {"step":"known_wallets","pct":70}`
6. `event: progress` | `data: {"step":"dev_history","pct":80}`
7. `event: progress` | `data: {"step":"scoring","pct":90}`
8. `event: verdict`  | `data: {"verdict":"CAP","confidence":0.96,"subclass":"extraction","reasons":[...]}`

## Bot / Frontend client communication
The Telegram bot acts as an internal HTTP client querying the backend API.
* Address check commands send a `POST /v1/scan` request.
* If streaming mode is disabled (`stream: false`), the endpoint blocks and returns the final verdict payload as a standard JSON response.
