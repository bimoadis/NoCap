CREATE TABLE IF NOT EXISTS "bridge_transactions" (
	"tx_hash" varchar(66) PRIMARY KEY NOT NULL,
	"bridge_name" varchar(50) NOT NULL,
	"source_chain_id" varchar(20) NOT NULL,
	"source_address" varchar(64) NOT NULL,
	"target_chain_id" varchar(20) NOT NULL,
	"target_address" varchar(64) NOT NULL,
	"amount" varchar(78) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_rules" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"severity" varchar(10) NOT NULL,
	"condition" jsonb NOT NULL,
	"message" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'outcomes'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "outcomes" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'predictions'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "predictions" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_chain_id_mint_pk" PRIMARY KEY("chain_id","mint");--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_chain_id_mint_pk" PRIMARY KEY("chain_id","mint");--> statement-breakpoint
ALTER TABLE "outcomes" ADD COLUMN "chain_id" varchar(50) DEFAULT 'solana' NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "chain_id" varchar(50) DEFAULT 'solana' NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "uaim_document" jsonb;