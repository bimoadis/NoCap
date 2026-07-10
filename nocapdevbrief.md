# NOCAP · Dev Brief v1

Dokumen ini untuk developer yang akan membangun backend dan utility NOCAP. File `nocap_website.html` yang dikirim bersama brief ini adalah frontend konsep: semua scan di dalamnya simulasi, tapi kontrak API, nama event SSE, dan nama field di halaman itu sudah final. Tugas backend adalah membuat kontrak itu nyata.

## 0. Produk dalam satu paragraf

NOCAP mengamati 20 trade pertama setiap token baru di pump.fun, menelusuri siapa yang mendanai setiap pembeli, lalu mengeluarkan satu verdict: **CAP** (setup ekstraksi, supply dikuasai satu entitas) atau **NO CAP** (pola organik), dengan angka confidence dan alasan satu kalimat. Positioning nya infrastructure: verdict dikonsumsi lewat API, SSE, iframe, dan bot. Bukan dashboard, bukan chart.

## 1. Scope dan prioritas

| Fase | Isi |
|---|---|
| P0 | Ingestion pipeline, enrichment, feature engine rule based, verdict API + SSE, prediction log, outcome oracle |
| P1 | Telegram bot, public accuracy page, wallet endpoint, iframe embed |
| P2 | Chrome extension (read only), X bot, tooling rekalibrasi regime |

Non goals v1: model ML, multichain, token sendiri, auto trading, mobile app. Jangan dikerjakan.

## 2. Arsitektur

```
Helius stream ──> ingestor ──> token buffer (20 trade pertama)
                                    │
                              enrichment workers
                       (wallet profile + funding 1 hop, cached)
                                    │
                              feature engine ──> scorer ──> verdict
                                    │                         │
                              Postgres (prediction log)   SSE / API / bot
                                    │
                            outcome oracle (cron) ──> metrics publik
```

Stack yang disarankan: TypeScript + Node 20 + Fastify, Postgres 16, Redis 7 (cache + queue via BullMQ), deploy di VPS atau Railway/Fly. Boleh Go kalau lebih nyaman; kontrak API tidak berubah.

## 3. Ingestion

* Sumber data: Helius. Mulai dari plan Developer (Enhanced WebSocket `transactionSubscribe`). Upgrade ke Business untuk LaserStream gRPC hanya kalau latency terbukti jadi masalah.
* Subscribe ke program bonding curve pump.fun. Verifikasi program id terbaru di docs pump.fun; id yang historis dipakai: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`.
* Event yang harus diparse: token create (mint, creator, timestamp, initial buy, metadata socials) dan trade (mint, trader, side, sol_amount, token_amount, slot, signature).
* Setiap mint baru membuka buffer. Scan terpicu saat trade ke 20 masuk, atau timeout 15 menit, mana yang lebih dulu.

## 4. Enrichment (bottleneck utama, cache agresif)

Untuk deployer dan setiap buyer di 20 trade pertama:

* umur wallet (timestamp tx pertama) dan jumlah tx
* transfer SOL masuk terakhir sebelum buy: alamat funder, jarak waktu ke launch
* klasifikasi funder: deployer, 1 hop dari deployer, CEX hot wallet (maintain daftar), sesama buyer, atau unknown
* flag dari reputation cache: known sniper, keterlibatan rug sebelumnya

Semua profil masuk tabel `wallet_profiles` dan Redis, refresh incremental saja. Wallet bundler dipakai berulang, jadi cache yang warm menurunkan biaya dan latency drastis. Log jumlah RPC call per scan sejak hari pertama; itu metrik biaya utama kita.

## 5. Features v1 (rule based, semua threshold di config)

| Feature | Definisi singkat |
|---|---|
| funding_parent_share | porsi buyer yang berbagi satu funder yang sama |
| deployer_funded | buyer yang didanai deployer, langsung atau 1 hop |
| same_block_count | trade di slot yang sama dengan create |
| size_uniformity | stdev ukuran buy dalam SOL (seragam = bot) |
| fresh_wallet_ratio | buyer berumur di bawah 1 hari |
| dev_history | jumlah launch, rasio mati di bawah 10 menit, waktu rug terakhir |
| dev_commitment | dev buy ada dan masih di hold di trade 20, socials ada di metadata |
| known_bad_overlap | buyer yang tercatat di rug sebelumnya |

Threshold jangan pernah hardcoded. Semua di tabel config dengan `regime_version`, bisa reload tanpa deploy. Frontend sudah menampilkan string regime (contoh `REGIME W14`), ambil dari sini.

## 6. Verdict

Tiga kelas internal: `extraction` (tampil CAP), `organic` (tampil NO CAP), `coordinated` (self buy tapi committed; v1 dipetakan ke NO CAP dengan flag warning). Response selalu berisi confidence 0 sampai 1 dan `reasons[]`, masing masing `{code, text, severity}` dengan text satu baris bahasa manusia karena dipakai langsung sebagai tooltip.

## 7. Kontrak API (source of truth, sudah cocok dengan HTML)

```
POST /v1/scan            body: {"chain":"solana","mint":"...","stream":true}
  SSE event: progress    data: {"step":"funding_graph","pct":42}
  SSE event: cluster     data: {"id":"C114","wallets":14,"parent":"7xKp...9fQ2"}
  SSE event: verdict     data: {"verdict":"CAP","confidence":0.96,
                                "subclass":"extraction","reason":"..."}

GET /v1/token/:mint      verdict dari cache + ringkasan feature
GET /v1/wallet/:addr     {"label","launches","dead_under_10m",
                          "avg_extraction_sol","funded_snipers","cluster","trust"}
GET /v1/metrics/public   angka untuk accuracy page
GET /embed?mint=...      halaman kecil untuk iframe, render chip verdict, subscribe SSE
```

Urutan step SSE: deployer, buyers, funding_graph, clustering, similarity, known_wallets, dev_history, bundle, scoring. Auth pakai header API key, rate limit per key.

## 8. Prediction log dan outcome oracle (jantung self improving loop)

* `predictions`: immutable, insert saat verdict keluar. Simpan snapshot fitur (JSON), regime_version, timestamp. Tidak boleh ada update setelah insert; ini yang mencegah kebocoran informasi masa depan saat evaluasi.
* `outcomes`: cron tiap 5 menit melabeli token yang sudah berumur 30 menit dan 24 jam. Definisi mekanis awal (semua configurable): `rug_30m` = harga turun 90%+ dari peak DAN (dev jual 50%+ holdings ATAU cluster net sell 70%+), `dead_24h`, `alive_24h`, `graduated` (bonding curve selesai).
* Metrics: precision dan recall per kelas plus Brier score untuk kalibrasi, rolling 30 hari, dipublish apa adanya termasuk miss.
* Ruleset atau threshold baru wajib lewat shadow mode: scoring paralel tanpa dipublish, promote manual hanya kalau menang di data 14 hari terakhir.

## 9. Surfaces

* **Telegram bot (P1).** User paste CA, bot balas verdict, confidence, dan 3 reason teratas. Command `/wallet <addr>` untuk reputasi. Bot hanya konsumen API internal.
* **Accuracy page (P1).** Render dari `/v1/metrics/public`. Transparansi adalah fitur brand, jangan filter angka jelek.
* **Iframe (P1).** Route `/embed`, ringan, tanpa dependency berat, karena ini yang akan ditunjukkan ke terminal saat pitching integrasi.
* **Extension (P2).** Manifest V3, read only, inject chip verdict di pump.fun, Axiom, Photon, GMGN, DexScreener. Tanpa permission wallet apa pun, repo open source, karena kepercayaan adalah barrier utama extension crypto.
* **X bot (P2).** Reply mention dengan verdict. Penting: jangan pernah menaruh URL di teks reply. Pricing X pay per use menghitung post ber URL $0.20 vs $0.015 tanpa URL. Gambar verdict card digenerate server side.

## 10. Ops dan guardrail biaya

Budget MVP $200 sampai $400 per bulan. Alert saat pemakaian credits Helius lewat 70%. Target latency: verdict p50 di bawah 10 detik setelah trade ke 20 dengan cache warm; token pertama yang cold boleh lebih lambat. Jangan publish daftar lengkap fitur dan threshold di docs publik; begitu verdict dipercaya, dia jadi target manipulasi.

## 11. Validasi sebelum go live

Sebelum realtime dinyalakan, backtest ruleset terhadap dataset publik: dataset 860 ribu launch pump.fun di Zenodo (Kamat 2026, arXiv:2607.02823, lisensi CC BY 4.0) dan MELT (arXiv:2602.13480). Gate minimal: precision kelas CAP 90%+ di holdout. Kalau gagal, threshold dikalibrasi ulang dulu, bukan dipaksakan live.

## 12. Milestones

| Milestone | Definition of done |
|---|---|
| M1 | Scan satu CA end to end via API, SSE sesuai kontrak, prediction tercatat, p50 di bawah 15 detik warm |
| M2 | Outcome oracle jalan, `/v1/metrics/public` hidup, satu minggu data terkumpul |
| M3 | Telegram bot dan accuracy page live untuk publik |
| M4 | API key eksternal dan iframe siap dipakai pihak ketiga |

## 13. Repo dan environment

Monorepo pnpm: `apps/api`, `apps/worker`, `apps/bot`, `packages/core` (features + scoring), `packages/db`. Env minimum: `HELIUS_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `TG_BOT_TOKEN`, `REGIME_VERSION`.

## 14. Keputusan yang boleh kamu ambil sendiri vs yang harus didiskusikan

Silakan putuskan sendiri: pilihan queue, ORM, struktur internal worker, hosting. Diskusikan dulu sebelum implement: perubahan kontrak API, definisi label outcome, threshold awal per feature, dan sumber daftar CEX hot wallet.
