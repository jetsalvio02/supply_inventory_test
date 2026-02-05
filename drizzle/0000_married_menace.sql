CREATE TYPE "public"."item_status" AS ENUM('IN_STOCK', 'OUT_OF_STOCK');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('IN', 'OUT', 'FORWARD');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"beginning_stock" integer DEFAULT 0,
	"forwarded_balance" integer DEFAULT 0,
	"total_in" integer DEFAULT 0,
	"total_out" integer DEFAULT 0,
	"actual_balance" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_summary_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"supplier_id" integer,
	"user_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"quantity" integer NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"status" "item_status" DEFAULT 'IN_STOCK',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"transaction_id" integer NOT NULL,
	"in_qty" integer DEFAULT 0,
	"out_qty" integer DEFAULT 0,
	"balance" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "units_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"role" varchar(50) DEFAULT 'staff',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inventory_summary" ADD CONSTRAINT "inventory_summary_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_cards" ADD CONSTRAINT "stock_cards_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_cards" ADD CONSTRAINT "stock_cards_transaction_id_inventory_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."inventory_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inv_tx_item_idx" ON "inventory_transactions" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "stock_card_item_idx" ON "stock_cards" USING btree ("item_id");