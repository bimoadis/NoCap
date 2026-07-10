CREATE TABLE IF NOT EXISTS "outcomes" (
	"mint" varchar(44) PRIMARY KEY NOT NULL,
	"rug_30m" boolean DEFAULT false NOT NULL,
	"dead_24h" boolean DEFAULT false NOT NULL,
	"alive_24h" boolean DEFAULT false NOT NULL,
	"graduated" boolean DEFAULT false NOT NULL,
	"peak_price_sol" double precision DEFAULT 0 NOT NULL,
	"exit_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "predictions" (
	"mint" varchar(44) PRIMARY KEY NOT NULL,
	"verdict" varchar(20) NOT NULL,
	"confidence" double precision NOT NULL,
	"subclass" varchar(50) NOT NULL,
	"reasons" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	"regime_version" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regime_configs" (
	"regime_version" varchar(50) PRIMARY KEY NOT NULL,
	"max_parent_share" double precision NOT NULL,
	"max_fresh_wallet_ratio" double precision NOT NULL,
	"max_block_trades" integer NOT NULL,
	"max_size_uniformity" double precision NOT NULL,
	"max_dev_launches_dead" double precision NOT NULL,
	"min_dev_hold_sol" double precision NOT NULL,
	"max_bad_overlap_count" integer NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_profiles" (
	"address" varchar(44) PRIMARY KEY NOT NULL,
	"first_tx_timestamp" timestamp,
	"tx_count" integer DEFAULT 0 NOT NULL,
	"last_funder" varchar(44),
	"funder_type" varchar(50) DEFAULT 'unknown' NOT NULL,
	"reputation_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"launches" integer DEFAULT 0 NOT NULL,
	"dead_under_10m" integer DEFAULT 0 NOT NULL,
	"avg_extraction_sol" double precision DEFAULT 0 NOT NULL,
	"funded_snipers" integer DEFAULT 0 NOT NULL,
	"cluster" varchar(50),
	"trust" double precision DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
