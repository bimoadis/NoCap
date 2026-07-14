# NoCap · Cross Chain Intelligence Architecture

Internal architecture document · v1.0 · July 2026
Author role: Principal Crypto Product Architect
Status: Draft for engineering review
Scope: Research on Robinhood Chain, abstraction design, universal asset model, expansion roadmap, and the technical brief for turning NoCap from a Solana analyzer into a modular cross chain intelligence engine.

---

## 0. Executive summary

Three findings drive everything in this document.

First, Robinhood Chain is real, live, and structurally familiar. It launched public mainnet on July 1, 2026 as a permissionless Ethereum Layer 2 on the Arbitrum Orbit stack: chain ID 4663, ETH for gas, no native token, roughly 100ms soft confirmations, Ethereum blobs for data availability, Blockscout as the canonical explorer, Chainlink as the official oracle layer. It is a normal EVM chain wearing a brokerage brand.

Second, and this is the surprise that changes our priorities: the chain Robinhood built for tokenized stocks got colonized by memecoins in week one. Roughly $135M of value and 800k addresses arrived in the first two weeks, but tokenized RWAs account for only about $12.8M of it. The dominant activity is degen trading: CASHCAT hit a ~$137M market cap in a day, hood.fun launched as the self described "pump.fun of $HOOD" with a bonding curve that graduates tokens to Uniswap v3, NOXA runs a competing launchpad, and open source volume bots that game NOXA trending tabs already exist on GitHub. This is NoCap's exact home turf, replayed on a two week old chain with almost zero analysis tooling. The window to be the default intelligence layer there is open right now and will not stay open.

Third, Robinhood is the most agent forward ecosystem in crypto. Agentic Trading (via a Trading MCP server), Agentic Accounts, an Agentic Credit Card, and third party agent infrastructure (SQD MCP servers, x402 paid tool marketplaces settling in USDG on Robinhood Chain) mean the consumers of intelligence on this chain will increasingly be AI agents, not humans. NoCap should ship its verdicts as an MCP tool and an x402 paid endpoint, not only as a web page.

The architectural conclusion: do not port NoCap to Robinhood Chain. Refactor NoCap into a chain agnostic engine with a thin adapter per chain, where Solana becomes the first adapter rather than the foundation. The rest of this document specifies how.

---

## 1. Robinhood Chain: research findings

### 1.1 Core architecture

| Property | Value |
|---|---|
| Type | Permissionless Ethereum Layer 2, Arbitrum Orbit stack |
| Mainnet launch | July 1, 2026 (public testnet since February 10, 2026) |
| Chain ID | 4663 mainnet · 46630 testnet |
| Gas token | ETH (no native chain token) |
| Block cadence | ~100ms soft confirmations from a Robinhood operated sequencer |
| Data availability | Ethereum blobs |
| Settlement | Ethereum, via the Arbitrum rollup pipeline |
| Public RPC | rpc.mainnet.chain.robinhood.com |
| Sequencer feed | websocket feed endpoint published in official docs (testnet: feed.testnet.chain.robinhood.com) |
| Explorer | robinhoodchain.blockscout.com (Blockscout, with public REST and JSON APIs) plus third party Robinscan |
| Account abstraction | ERC4337 supported via Alchemy bundler, smart wallets, gas sponsorship |

Implications for us: everything we know about EVM analysis applies. Standard JSON RPC, standard logs and traces, ABI decoding, contract verification through Blockscout. The 100ms soft confirmation cadence means "same block sniping" is a much finer grained concept than on Solana; time windows, not block counts, must become our normalized unit.

Trust note worth stating plainly: the sequencer is centralized and operated by Robinhood, which is normal for Orbit chains at launch. For an intelligence product this is mostly upside (a stable, ordered feed) but it is a data dependency to monitor.

### 1.2 Data and infrastructure providers

* RPC: Alchemy is the officially recommended provider (node API, ERC4337 bundler, gas manager); QuickNode, dRPC, Blockdaemon, Validation Cloud and others already list the chain. Public endpoints exist but are rate limited.
* Indexing: SQD (Subsquid) already serves a decoded Robinhood Chain archive with typed tables and, notably, an MCP server product aimed at feeding agents structured chain data. The Graph works only as self hosted Graph Node; the chain is not in Graph Studio defaults yet. Ecosystem repos on GitHub already scaffold subgraphs against the testnet.
* Charting and discovery: DexScreener, Defined, GeckoTerminal all track the chain; GMGN indexing is being courted by hood.fun. CoinGecko lists the top tokens.
* Bridging: canonical Arbitrum bridge plus fast bridges (Relay, Across). Pump.fun's app added Robinhood Chain token trading with settlement from SOL, no manual bridging. OpenSea supports swaps in.

### 1.3 Token standards and asset classes

Three distinct asset classes live on the chain, and they demand different risk models:

1. **Stock Tokens.** 95 tokenized equities at launch (NVDA, GOOG, AAPL and others), issued by Robinhood entities and structured legally as tokenized debt securities, available in 120+ countries but not the US. They are ERC20s with issuer controls, priced and synchronized through Chainlink, usable as DeFi collateral (Morpho powers "Robinhood Earn" at a target ~7% on USDG). Risk here is issuer risk, oracle deviation, liquidity versus NAV, and impersonation, not rug risk.
2. **Memecoins.** Standard ERC20s, mostly minted through launchpads: hood.fun (bonding curve, fixed 1B supply, a "Migrator" contract that seeds a Uniswap v3 pool on graduation and locks LP) and NOXA (graduates to Uniswap v3 1% fee tier, in app trending powered by GeckoTerminal). This is a faithful EVM translation of the pump.fun lifecycle.
3. **Stablecoins and DeFi assets.** USDG (Paxos Global Dollar) is the flagship stable, with faucets even on testnet; bridged majors round it out.

### 1.4 DEX and liquidity landscape

Day one DeFi stack: Uniswap v3 as the primary public AMM (its Robinhood instance briefly ranked sixth in volume across all chains during the meme surge), Arcus (a stock token and crypto DEX with perps, built by dYdX Labs with Robinhood Crypto), Lighter (ZK orderbook DEX), 1inch, Rialto (spot), Pleiades (proprietary AMM for prop flow), Arrakis (liquidity management), Morpho (lending), Meridian (RWA and prediction markets), Native (price discovery). Chainlink is the official data and cross chain oracle layer.

One launch statistic matters for our risk engine: roughly $570M of day one volume against about $21.7M of liquidity. Volume to liquidity ratios that extreme are the natural habitat of wash trading and volume bots, and open source volume bots targeting NOXA trending already exist. Manipulation detection is not a hypothetical feature on this chain; it is table stakes.

### 1.5 Wallets

Robinhood Wallet is the distribution channel into 120+ countries and the default retail entry point. Standard EVM wallets (MetaMask and friends) work via ChainList. ERC4337 smart accounts are first class through Alchemy. Expect a much higher share of smart contract wallets and sponsored gas transactions than on Solana, which affects how we fingerprint "wallet DNA."

### 1.6 AI and agent integrations

This is the most differentiated part of the ecosystem:

* **Robinhood Agentic Trading** (launched May 27, 2026, extended to crypto at the July keynote): users connect Claude, ChatGPT, Cursor, Grok and others to a dedicated Agentic Account through the Robinhood Trading MCP endpoint; agents read portfolio data and place trades within user set guardrails.
* **Agentic Credit Card** via a Banking MCP server.
* **Third party agent infra**: SQD's MCP server for structured chain data; an open source x402 marketplace exposing 1,400+ pay per call tools with USDG settlement on Robinhood Chain; Bastion, an autonomous fund of agents trading Stock Tokens with onchain proofs.

The pattern is unmistakable: on this chain, agents are first class market participants, and they will need a machine readable risk oracle. Nobody credible occupies that seat yet.

### 1.7 Ecosystem temperature check

Cumulative addresses approached 200k within the first week and ~800k by mid July depending on the measure used; TVL figures range from ~$76M (day four) to ~$234M (protocol TVL per Entropy Advisors' Dune dashboard) with roughly 90% of early TVL traced to a single source, and a 90 day gas fee waiver is subsidizing activity. A prediction market app (World) publicly migrated from Solana to Robinhood Chain in week one. The honest read: real momentum, heavily meme driven, thin underlying liquidity, statistics inflated by incentives. In other words, exactly the conditions under which retail gets hurt and an honesty layer earns its keep.

---

## 2. Concept overlap: Solana vs Robinhood Chain

The concepts NoCap already reasons about map across chains with high fidelity, but the *evidence* behind each concept differs. This distinction (stable concept, chain specific evidence) is the foundation of the whole architecture.

### 2.1 Comparison matrix

| Concept | Solana (current NoCap) | Robinhood Chain | Portability |
|---|---|---|---|
| Launchpad | pump.fun bonding curve program | hood.fun, NOXA bonding curves | High. Same lifecycle: curve → graduation → AMM |
| Graduation target | Raydium / PumpSwap pool | Uniswap v3 pool via Migrator contract | High, different venue mechanics (v3 = concentrated liquidity, NFT positions) |
| Liquidity pool | AMM accounts, LP tokens | Uniswap v3 positions are NFTs, not fungible LP tokens | Medium. "LP lock" verification logic must be venue specific |
| LP lock / burn | LP token burn or locker programs | Locker contracts holding the v3 position NFT (hood.fun locks permanently) | Medium |
| Creator / deployer | Token mint creator, update authority | Contract deployer EOA (or factory) | High |
| Mint authority | SPL mint authority flag | Owner or minter role, upgradeable proxies, hidden mint functions in bytecode | Medium. EVM requires bytecode and ABI analysis, not a flag read |
| Freeze authority | SPL freeze authority | Blacklist and pause functions, transfer hooks | Medium |
| Holder distribution | Token accounts by owner | ERC20 balances via logs and indexer | High |
| Token metadata | Metaplex metadata + offchain JSON | ERC20 name and symbol onchain; socials live in launchpad metadata, not a chain standard | Medium |
| DEX trade stream | Program logs via WebSocket or gRPC | Swap events from pool contracts via logs, sequencer feed | High |
| Market cap / price | Curve state, pool reserves | Curve state, pool state, Chainlink for majors | High |
| Snipers | Same slot buys after create | Same second buys after pool creation (100ms blocks; use time windows) | High with unit change |
| Fresh wallets | Wallet age, funding tx | Wallet age nearly meaningless on a 2 week old chain; bridge provenance becomes the signal | Concept survives, thresholds do not |
| Funding graph | SOL transfer tracing, CEX heuristics | ETH and USDG transfer tracing, bridge chokepoints (Relay, Across, canonical), then continuation on the source chain | High, and richer: cross chain hops |
| Wash trading / volume bots | Self swap detection | Already observable (NOXA trending bots), plus smart account batching | High |
| Social metadata | Launchpad profile, X links | Launchpad profile, X links | High |
| Honeypot / sellability | Limited simulation | eth_call simulation of buy and sell paths, a capability Solana never gave us cleanly | New capability on EVM |
| Contract verification | Not applicable (programs, IDLs) | Blockscout verified source, a strong trust signal | New capability on EVM |
| Issuer assets (stocks, RWA) | Not applicable | Stock Tokens with official issuance registry, oracle NAV | New asset class |

### 2.2 What the matrix teaches us

1. Around 80% of NoCap's analytical concepts transfer directly. The launchpad lifecycle, the sniper problem, holder concentration, deployer reputation, funding graphs: all of it exists on both chains.
2. The remaining 20% splits into two buckets: evidence gathering that must be rewritten per chain (mint authority vs ownable proxies), and genuinely new capabilities EVM unlocks (honeypot simulation, source verification) or demands (issuer asset risk).
3. Calibration is chain and era specific. A "fresh wallet" heuristic tuned for Solana is nonsense on a chain where every wallet is two weeks old. This generalizes the regime concept we already adopted for the verdict engine: a regime is now (chain, era), and every threshold lives in a regime scoped config, never in code.

---

## 3. Making NoCap chain agnostic

Every feature in the current MVP, restated as a chain neutral capability. The left column is what exists today; the right column is the port it becomes.

| Today (Solana coupled) | Becomes (chain agnostic port) | Notes |
|---|---|---|
| analyzeSolanaCA() | analyzeAsset(assetRef) where assetRef = {chainId, address, kind?} | Entry point resolves chain from a registry, never from parsing the address format alone (base58 vs 0x is a hint, not an API) |
| fetchPumpfun() | LaunchSourceAdapter.getLaunchContext(asset) | pump.fun, hood.fun, NOXA, "direct deploy" are all providers of the same LaunchContext shape |
| Solscan parser | ExplorerAdapter | Solscan, Blockscout, Robinscan behind one interface: tx history, holders, verification status, labels |
| Raydium pool reader | DexAdapter.getMarketState(asset) | Raydium, PumpSwap, Uniswap v3, Arcus. Must express both fungible LP and NFT position models |
| Mint authority check | ControlSurfaceProbe | Returns a normalized list of powers someone still holds over the asset: mint, freeze or blacklist, pause, upgrade, fee switch, with evidence per chain |
| Wallet behavior (Solana tx history) | WalletAdapter.getWalletDNA(address, chain) | Age, funding lineage, behavioral fingerprint, reputation cache; cross chain identity stitching via bridges comes later |
| Holder concentration | OwnershipAdapter.getDistribution(asset) | Same math everywhere; data source differs |
| Suspicious pattern rules | RiskEngine over normalized features only | Rules never touch raw chain data; they consume the Universal Asset Intelligence Model |
| Token narrative + socials | NarrativeEngine over normalized metadata + market context | Chain agnostic by construction; prompts must stop mentioning Solana |
| AI explanation | AIContextBuilder → LLM | Builds context packs from the normalized model; per chain vocabulary injected as data, not as prompt forks |

Design rule that makes or breaks this refactor: **shared modules consume only normalized types.** If a shared module ever imports a Solana SDK type or an ethers type, the abstraction has failed. Chain SDKs live inside adapters and nowhere else.

---

## 4. Adapter architecture

### 4.1 A challenge to the proposed shape

The brief proposes a vertical chain of adapters (Chain → Explorer → DEX → Launchpad → Wallet → AI → Risk → Narrative → Scoring → UI). I recommend against a literal pipeline for two reasons.

First, the dependencies are not linear. The Risk Engine needs launch context, market state, ownership, and wallet DNA *simultaneously*; the Narrative Engine needs metadata and market state but not wallet DNA; honeypot probing needs nothing but the chain client. A pipeline forces artificial ordering and serial latency onto a graph shaped problem.

Second, capabilities are uneven across chains. Solana has no bytecode honeypot probe; a future Bitcoin adapter would lack most of this. A pipeline breaks when a stage is missing; a capability model degrades gracefully.

So the architecture is **ports and adapters with a capability registry**, and the "pipeline" is a per request orchestration plan computed from what the target chain actually supports.

### 4.2 Module map

```
                       ┌──────────────────────────────┐
                       │        Chain Registry         │
                       │ chainId → adapter set +       │
                       │ capability manifest + regime  │
                       └──────────────┬───────────────┘
                                      │
        ┌──────────── Orchestrator (plans + runs the fetch graph) ────────────┐
        │                                                                     │
  ChainClientAdapter   ExplorerAdapter   DexAdapter   LaunchSourceAdapter     │
  (RPC, logs, sim)     (txs, holders,    (pools,      (curve state,           │
                        verification)     trades,      graduation,            │
                                          liquidity)   creator profile)      │
        │                     │              │              │                 │
  WalletAdapter        OwnershipAdapter  ControlSurfaceProbe  BridgeAdapter   │
  (age, funding,       (distribution,    (mint/pause/upgrade  (provenance     │
   behavior, repcache)  top holders)      powers + honeypot)   across chains) │
        └──────────────────────────────┬──────────────────────────────────────┘
                                       │  all outputs normalize to
                              Universal Asset Intelligence Model
                                       │
                 ┌─────────────────────┼─────────────────────┐
            Risk Engine          Narrative Engine        Scoring Engine
        (canonical risk codes   (what is this token,    (verdict + confidence,
         + per chain evidence)   who is behind it,       regime calibrated)
                                 why does it exist)
                 └─────────────────────┼─────────────────────┘
                              AI Context Builder
                     (context packs for the explainer LLM)
                                       │
                    API / SSE / MCP tool / x402 endpoint / UI
```

### 4.3 Responsibilities per module

* **Chain Registry.** Static config plus feature flags: which adapters exist for a chain, which capabilities they declare (canSimulateSell, hasVerifiedSource, hasIssuerRegistry, lpModel: fungible|nftPosition), and which regime config applies. Adding a chain means adding a registry entry and adapters, touching nothing else.
* **Orchestrator.** Turns analyzeAsset(assetRef) into a parallel fetch plan over available capabilities, with per adapter timeouts and partial failure semantics. Emits progress events (this is what the SSE stream and the scan UI consume).
* **ChainClientAdapter.** Lowest level: RPC, log subscription, transaction fetch, simulation (eth_call on EVM; transaction inspection on Solana). Owns provider failover and rate budgets.
* **ExplorerAdapter.** Uniform access to indexed history: address tx pages, holder lists, verification status, public labels. Blockscout REST on Robinhood Chain; existing Solscan style parsing on Solana; SQD or self hosted subgraphs as the scale path.
* **DexAdapter.** Market state per venue: price, depth, reserves or in range liquidity, pool age, fee tier, LP custody (who holds the LP tokens or the v3 position NFT, and is the holder a locker, a burn address, or the deployer).
* **LaunchSourceAdapter.** The launchpad abstraction: curve progress, creator profile and socials, graduation status and target, platform level flags (fixed supply guarantee, LP lock policy). Providers: pumpfun, hoodfun, noxa, direct.
* **WalletAdapter.** Wallet DNA: age, tx count, funding lineage (first inbound transfer and its source classification: bridge, CEX, deployer, peer), behavioral fingerprint (buy size entropy, hold times, venue habits), and the shared reputation cache keyed by (chain, address) with cross chain links when proven.
* **BridgeAdapter.** New, and strategic. On an L2, funding graphs terminate at bridge contracts; this adapter resolves a bridge deposit back to the source chain transaction and hands the trace to the WalletAdapter on that chain. This is how NoCap's funding graph becomes genuinely cross chain, and it is a moat: single chain tools structurally cannot follow the money home.
* **ControlSurfaceProbe.** Answers one question with evidence: what powers does anyone still hold over this asset? On Solana: authority flags. On EVM: owner and role scans, proxy and upgradeability detection, hidden mint or fee functions, pause and blacklist hooks, plus buy and sell simulation for honeypot behavior.
* **Risk Engine.** Consumes only the normalized model. Maintains the canonical risk taxonomy (stable codes like CONTROL_MINT_OPEN, LP_UNLOCKED, HOLDERS_CONCENTRATED, FUNDING_PARENT_SHARED, VOLUME_SYNTHETIC, IMPERSONATION_SUSPECTED), each with severity, confidence, and a chain specific evidence payload. Rules are data driven and regime scoped.
* **Narrative Engine.** Produces the human story: what the token claims to be, the meme or RWA context, social presence, deployer history in prose. LLM assisted, grounded strictly in normalized fields.
* **Scoring Engine.** Folds risks and context into the verdict surface NoCap already ships (score, verdict, one sentence reason), calibrated per regime, logged to the immutable prediction store from the existing dev brief. The self improving loop (prediction log → outcome oracle → shadow challenger) carries over unchanged and now runs per chain.
* **AI Context Builder.** Assembles bounded, cited context packs for the explainer model. One template, chain flavored vocabulary injected as data. Also the module that renders the same pack as an MCP tool response for agents.
* **UI / API surface.** Renders the Universal Asset Intelligence Model. It receives capability flags so it can distinguish "not applicable on this chain" from "unknown" from "checked and clean." That three way distinction is a product requirement, not a nicety; collapsing it destroys user trust.

---

## 5. Universal Asset Intelligence Model (UAIM)

Every chain adapter set produces the same normalized document. The frontend, the risk rules, the prompts, and the API schema all speak UAIM and never speak chain.

Top level shape (field groups, not code):

* **asset**: chainId, address, kind (memecoin | issuerAsset | stable | lpPosition | unknown), symbol, name, decimals, supply model (fixed | mintable | rebasing), age.
* **deployment**: deployer, deployedAt, launchSource (pumpfun | hoodfun | noxa | direct | issuer), factoryUsed, sourceVerified, upgradeable.
* **creator**: address(es), profile links, prior launches, prior outcomes (graduated, died, rugged), reputation score from the cache.
* **controlSurface**: list of live powers {power, holder, severity, evidence} covering mint, freeze or blacklist, pause, upgrade, fee mutation, plus sellability {simulated: bool, result, tax estimate}.
* **liquidity**: venues[] each with {venue, model: fungibleLp | nftPosition | bondingCurve, depth, lpCustody: burned | locked(until, locker) | heldBy(address), share of supply in pool}.
* **trading**: window stats {trades, buyers, sellers, volume, uniqueMakers}, early window profile {tradesInFirstNSeconds, buySizeEntropy, sniperShare}, manipulation flags {washScore, syntheticVolumeScore}.
* **ownership**: holderCount, topN shares, cluster adjusted concentration (clusters from the funding graph, not raw addresses), insider share estimate.
* **fundingGraph**: nodes and edges for early buyers, parent candidates, bridge chokepoints with resolved source chains where known.
* **market**: price, marketCap or FDV, curve progress if pre graduation, reference price basis (curve | pool | oracle) and for issuer assets the oracle vs venue deviation.
* **narrative**: claimedIdentity, memeContext, socials{platform, url, verifiedMatch}, impersonation check result (critical for Stock Tokens: is this the issuer's NVDA or a lookalike).
* **walletDNA** (when the query is a wallet, or attached per key wallet in a token report): age, fundingLineage, behaviorFingerprint, reputationTags.
* **risk**: array of canonical risk codes with severity, confidence, evidence refs.
* **score**: value, verdict, confidence, regimeVersion, oneLineReason.
* **warnings**: capability gaps ("sell simulation unavailable on this chain") and data quality notes, surfaced honestly.
* **provenance**: which adapters produced which fields, fetch timestamps, data sources. Every claim in the UI traces to a source; this is brand critical for a product called NoCap.

Versioning rule: UAIM is a versioned public contract (uaimVersion field). Adapters may lag on optional fields; they may never repurpose one.

---

## 6. Robinhood Chain specific opportunities (opinionated)

Ranked by conviction.

1. **Own the memecoin trenches now (highest conviction, this month).** hood.fun and NOXA are pump.fun clones on a chain with retail flow, incentive inflated volume, active volume bots, and effectively zero incumbent analysis tooling. NoCap's existing playbook (early trade window analysis, deployer history, funding graphs, LP custody checks) transfers almost mechanically. Being the first "paste a Robinhood Chain CA" analyzer is a narrative gift: every crypto media outlet is covering this chain weekly right now.
2. **Fake Stock Token detection (unique to this chain, high leverage).** 95 official Stock Tokens plus a memecoin culture guarantees impersonation: fake NVDA tickers, lookalike symbols, "wrapped" scams. NoCap can maintain a registry adapter against the official issuance list and answer a question nobody else is answering crisply: *is this the real one?* This also earns trust with exactly the audience (cautious retail) Robinhood is importing, and it is a wedge into conversations with Robinhood itself.
3. **Be the risk oracle for agents (strategic, 1 to 2 quarters).** Robinhood's Agentic Accounts, the Trading MCP, SQD's data MCP, and x402 tool marketplaces settling in USDG on this very chain all point one direction: agents will transact here and they need a machine readable safety check before they do. Ship nocap.check_asset as an MCP tool and as an x402 pay per call endpoint (USDG settlement is thematically perfect). An agent that pays 2 cents to avoid a honeypot is the cleanest product market fit sentence we have ever been able to write. Note the two sided nature: agents are also *suspects*: agent driven volume manipulation is already visible, and "was this pump agent generated" becomes a NoCap signal.
4. **Cross chain funding provenance as a moat.** Week one wallets on Robinhood Chain are all "fresh" by age, so the discriminating signal is where the bridge deposit came from. Resolving Relay, Across and canonical bridge deposits back to Solana or Ethereum wallets (where NoCap already has reputation data) gives us insight single chain tools cannot copy without rebuilding our entire history. The Solana reputation cache suddenly pays dividends on a different chain.
5. **RWA and issuer asset intelligence (later, defensible).** Oracle deviation alerts (venue price vs Chainlink NAV), liquidity depth vs redemption terms, corporate action awareness for tokenized equities. Lower urgency because RWA volume is only ~$12.8M today, but it is where Robinhood wants the chain to go, and being early positions NoCap as infrastructure rather than a degen tool when that shift happens.

What I would explicitly not do: build our own trading, our own launchpad, or a Robinhood specific fork of the product. The asset is the engine and its track record; the chain is a deployment target.

---

## 7. Product expansion roadmap

| Phase | Name | Content | Exit criteria |
|---|---|---|---|
| 1 | Solana consolidation (now) | Wrap existing MVP behind the port interfaces without changing behavior; introduce UAIM internally; stand up the chain registry with a single entry | Solana analysis produces UAIM documents; zero user visible regression |
| 2 | Universal engine | Extract shared risk taxonomy, scoring, narrative and prompts to /shared; regime scoped config store; capability manifests; provenance tracking | A second chain can be added without touching /shared (proven by a stub chain in CI) |
| 3 | Robinhood Chain | EVM adapter family (client, Blockscout explorer, Uniswap v3 DEX, hood.fun and NOXA launch sources, control surface probe with sell simulation, bridge adapter v1); Stock Token registry; launch the "first analyzer on Robinhood Chain" moment | Paste a 0x address from Robinhood Chain, get a full NoCap report; impersonation check live for all 95 Stock Tokens |
| 4 | Cross chain | Base and Ethereum mainnet reuse ~90% of the EVM family; bridge resolution stitches wallet identities across chains; unified reputation graph | One wallet page shows linked activity across at least 3 chains with evidence |
| 5 | AI portfolio intelligence | From single asset verdicts to portfolio and agent surfaces: watch a wallet or an agentic account, aggregate risk exposure, alerting; MCP and x402 productization; agent behavior analytics | External agents are paying callers; portfolio risk view in production |

Sequencing note: Phase 3 has a market timing component that Phases 1 and 2 do not. If engineering capacity forces a choice, it is acceptable to ship a narrower Phase 3 (memecoin scanning plus impersonation checks only) on a partially refactored engine, provided the adapter boundaries are respected. It is not acceptable to fork the codebase to go faster; that debt has killed better products.

---

## 8. Repository structure

```
nocap/
  chains/
    solana/
      client/            RPC, websocket, tx fetch, program log decoding
      explorer/          Solscan style parsing, holder queries
      dex/               raydium, pumpswap
      launchpads/        pumpfun
      wallet/            funding trace, CEX heuristics
      probes/            authority checks
      regime.config.json
    robinhood/
      client/            JSON RPC, log subscription, eth_call simulation
      explorer/          blockscout REST
      dex/               uniswapV3, arcus
      launchpads/        hoodfun, noxa
      wallet/            funding trace, bridge chokepoints
      bridges/           relay, across, canonical
      registry/          stock token issuance list + impersonation matcher
      probes/            controlSurface, honeypot
      regime.config.json
    base/                (Phase 4, reuses evm shared internals)
    ethereum/
    _evm-common/         shared EVM internals used ONLY by chain packages
  shared/
    types/               UAIM, risk codes, capability manifest (versioned)
    adapters/            port interfaces every chain implements
    risk/                canonical taxonomy + rule engine (data driven)
    scoring/             verdict, calibration, regime loading
    narrative/           narrative engine
    prompts/             templates; chain flavor injected as variables
    normalize/           helpers to build UAIM documents
    reputation/          cross chain wallet reputation graph
  services/
    api/                 REST + SSE + MCP tool + x402 endpoint
    orchestrator/        fetch planning, timeouts, partial results
    workers/             enrichment queues, outcome oracle, cache warmers
    indexer/             SQD pipelines / subgraph consumers per chain
  apps/
    web/                 UI (renders UAIM only)
    bot/                 Telegram
    extension/           browser overlay
  packages/
    db/                  prediction log, outcomes, reputation, config store
```

Enforcement, not convention: a lint rule (dependency cruiser or equivalent) forbids `shared/**` and `apps/**` from importing anything under `chains/**` or any chain SDK. Chain packages depend on shared types; never the reverse. `_evm-common` exists so Base and Ethereum do not copy paste the Robinhood adapters, but it is still a chain layer package and equally forbidden inside shared.

---

## 9. Technical dev brief

### 9.1 Architecture and data flow

Request path: `analyzeAsset({chainId, address})` → registry resolves adapter set and capability manifest → orchestrator emits a fetch plan (parallel adapter calls with budgets) → results normalize into a UAIM draft → risk, narrative and scoring engines run over the draft → prediction logged immutably → response streams to the caller (SSE progress events for the scan UI; single document for API and MCP callers).

Continuous path (per chain): launch listeners (pump.fun program stream on Solana; hood.fun and NOXA factory events plus Uniswap v3 PoolCreated on Robinhood Chain) → early trade buffering → proactive scans of every new launch → verdicts cached so user queries are usually reads, not fresh work. The existing NOCAP verdict pipeline (20 trade buffer, funding enrichment, outcome oracle, shadow challenger) is this path; it becomes one worker family per chain, sharing the reputation and prediction stores.

### 9.2 API layer

Public contract stays chain neutral: `POST /v1/scan {chainId, address, stream}`, `GET /v1/asset/:chainId/:address`, `GET /v1/wallet/:chainId/:address`, `GET /v1/metrics/public`, `GET /embed`. Additions: `chainId` becomes mandatory (with a resolver endpoint that guesses candidates from address format when omitted), and two new surfaces wrap the same core: an MCP server exposing `check_asset` and `check_wallet` tools, and an x402 paid variant of the same for agent callers with USDG settlement.

### 9.3 AI layer

One explainer pipeline, many chains. The AI Context Builder produces a bounded context pack from UAIM: identity, launch story, control surface, liquidity custody, early trade profile, funding graph summary, risks with evidence, and explicit capability gaps. Prompts must never branch on chain in template logic; chain vocabulary ("bonding curve on hood.fun graduating to Uniswap v3") arrives as data fields. Grounding rule: the explainer may only assert what UAIM contains, and every numeric claim carries a provenance ref. Model responses that speculate beyond the pack are a bug class, tested in CI with adversarial fixtures.

### 9.4 Normalization layer

The riskiest layer, because silent semantic drift here corrupts everything downstream. Three disciplines: (1) normalized fields carry units and bases explicitly (time in ms since pool creation, shares as fractions of circulating supply, liquidity in quote terms); (2) lossy mappings are annotated (Solana "freeze authority" and EVM "blacklist function" both normalize to power=freeze but keep their native evidence); (3) golden fixture tests per chain: recorded raw payloads in, expected UAIM out, run on every adapter change.

### 9.5 Scoring and risk engine

Canonical risk codes with per chain evidence, rules as data (JSON logic over UAIM paths) so tuning does not require deploys, thresholds scoped by regime (chain, era). Verdict semantics stay what NoCap users know: score, CAP or NO CAP style verdict, confidence, one line reason. Calibration per chain is mandatory from day one: Robinhood Chain week two base rates are unknown, so initial verdicts there ship with wider confidence intervals and the accuracy page reports per chain. The self improving loop (immutable predictions, mechanical outcome labels, shadow challengers) runs per chain; do not pool training across chains until distributions are demonstrably comparable.

### 9.6 Frontend components

The UI renders UAIM and capability flags, nothing else. Component inventory: asset header (identity, verdict chip, chain badge), control surface panel, liquidity custody panel (must render both LP token and NFT position models), early trade timeline, funding graph view (now with bridge nodes that expand to source chains), holder concentration with cluster adjustment, narrative card, warnings strip for capability gaps, and provenance popovers on every claim. One deliberate UX rule: "not applicable on this chain," "unknown," and "checked, clean" get three visually distinct treatments.

### 9.7 Bottlenecks and risks

* **RPC economics on a new chain.** Public endpoints are rate limited; archive depth and provider maturity vary. Budget per scan (calls and ms) enforced in the orchestrator, with the reputation and analysis caches as the primary cost lever, same lesson as Solana.
* **Indexing gaps.** No Graph Studio support; SQD archive is historical with real time on its roadmap. Early on we run leaner: direct log subscription plus targeted backfills, with SQD pipelines as the scale path.
* **100ms blocks.** Event volume per second is high and "block" loses meaning as an analysis unit; everything time windows. Soft confirmations can reorg relative to Ethereum finality: verdicts on seconds old data must state their finality basis.
* **Honeypot arms race.** Sell simulation is spoofable (contracts that behave until they do not). Treat simulation results as evidence, never proof, and pair with control surface findings.
* **Impersonation cat and mouse** on Stock Tokens; the registry matcher needs fuzzy symbol and metadata matching, not exact string checks.
* **LLM cost and latency** per analysis: context packs are bounded, cached per asset version, and re rendered only when UAIM materially changes.
* **Regulatory perception.** NoCap analyzes issuer assets on a broker branded chain; wording must stay factual and provenance backed, and the product must never look like investment advice. This is already house style; it becomes load bearing here.

### 9.8 Developer notes

* Adapter development order for Phase 3: ChainClient → Explorer → LaunchSource(hoodfun) → Dex(uniswapV3) → ControlSurfaceProbe → Wallet → Bridge. Each lands with golden fixtures and a capability manifest entry before the next starts.
* The bonding curve math of hood.fun and pump.fun differ; model curve progress as an adapter output (fraction complete, quote raised), never recompute platform math in shared code.
* Uniswap v3 requires in range liquidity depth, not raw reserves; use the pool's tick data via the indexer, and resolve position NFT custody for the LP lock check.
* Reputation cache keys become (chain, address); bridge resolved identity links are edges with evidence, never silent merges.
* Keep the existing Solana behavior byte identical through Phase 1; the refactor is proven by diffing UAIM outputs against current MVP outputs on a replay corpus.

### 9.9 Open questions

1. Stock Token contract mechanics: exact transfer restriction implementation, official registry endpoint or contract, and whether Robinhood publishes an authoritative issuance list we can consume programmatically. Needs onchain verification work; assumptions above are conservative.
2. Mainnet sequencer feed access policy and terms for sustained third party consumption.
3. hood.fun and NOXA factory addresses, event schemas, and whether their metadata (socials, images) is fetchable without scraping.
4. GMGN, DexScreener and GeckoTerminal API coverage depth for Robinhood Chain (fallback or primary for market data?).
5. x402 endpoint economics: price point per check, USDG settlement plumbing, and whether Robinhood's agent guidelines constrain third party tools.
6. Whether Solana remains the majority of usage after the Robinhood novelty fades; this affects how much Phase 4 investment the data justifies.

### 9.10 Tradeoffs accepted

* **Abstraction tax now vs fork debt later.** Phases 1 and 2 deliver zero visible features. Accepted: every serious multichain product that skipped this step (forked codebases per chain) paid more later.
* **Capability model complexity vs pipeline simplicity.** The registry and manifests add moving parts; accepted because graceful degradation across uneven chains is the product.
* **Per chain calibration vs single global model.** Slower to reach statistical confidence on new chains; accepted because pooled thresholds would be silently wrong on both sides.
* **Buy vs build on indexing.** We lean on SQD and Blockscout early instead of running our own indexers; accepted vendor risk in exchange for weeks of time to market, with raw log ingestion as the escape hatch.

### 9.11 Future proofing recommendations

1. Treat UAIM as the company's most valuable interface: versioned, documented, reviewed like a public API, because the MCP and x402 surfaces will make it one.
2. Keep the regime config store chain scoped and hot reloadable; every new chain is a new regime, and eras rotate faster than deploy cycles.
3. Build the bridge resolution layer as if five more L2s are coming, because they are; it is the single component that compounds in value with each added chain.
4. Publish per chain accuracy from day one on Robinhood Chain, including early misses. On a brand new chain everyone is guessing; the product that shows its error bars becomes the reference.
5. Design every human surface with an agent twin. Any report a person can read, an agent can fetch as structured UAIM plus a paid attestation. The likely end state on Robinhood Chain is agents checking with NoCap before they trade; build toward that from the first endpoint.

---

## Appendix A. Robinhood Chain quick reference

| Item | Value |
|---|---|
| Mainnet chain ID | 4663 |
| Testnet chain ID | 46630 |
| Public RPC | https://rpc.mainnet.chain.robinhood.com |
| Explorer | https://robinhoodchain.blockscout.com (API docs at /api-docs) |
| Third party explorer | https://robinscan.io |
| Faucet (testnet) | faucet.testnet.chain.robinhood.com; USDG via Paxos faucet |
| Recommended infra | Alchemy (node, ERC4337 bundler, gas manager); QuickNode, dRPC and others live |
| Indexing | SQD archive (decoded tables, MCP server); self hosted Graph Node only |
| Key DEXs | Uniswap v3 (primary), Arcus, Lighter, 1inch, Rialto, Pleiades |
| Launchpads | hood.fun (bonding curve → Uniswap v3, LP locked), NOXA |
| Oracle | Chainlink (official, incl. cross chain) |
| Stablecoin | USDG (Paxos) |
| Agent surface | Robinhood Trading MCP (agentic accounts), Banking MCP, SQD MCP, x402 marketplaces |

## Appendix B. Sources

Robinhood newsroom (mainnet, Stock Tokens, Agentic Trading announcements); Robinhood Chain developer docs (docs.robinhood.com/chain); Robinhood support articles (chain network details, Agentic Trading overview); CoinDesk, The Defiant, crypto.news, Cryptobriefing, DEXTools News, KuCoin News coverage of the July 2026 launch and ecosystem; Entropy Advisors Dune dashboard reporting; hood.fun launch press release; QuickNode builders guides; Alchemy and SQD chain pages; GitHub topic robinhood-chain and awesome-robinhood-chain ecosystem list; TechCrunch coverage of Agentic Trading. All figures as reported in the first two weeks after mainnet launch and subject to change; verify onchain before hard coding any address or threshold.
