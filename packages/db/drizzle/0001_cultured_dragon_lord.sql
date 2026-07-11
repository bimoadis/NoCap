CREATE TABLE IF NOT EXISTS "wallet_sessions" (
	"wallet" varchar(44) PRIMARY KEY NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"access" boolean DEFAULT false NOT NULL,
	"access_until" integer DEFAULT 0 NOT NULL,
	"spins" integer DEFAULT 0 NOT NULL,
	"burns" integer DEFAULT 0 NOT NULL,
	"free_scans" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
