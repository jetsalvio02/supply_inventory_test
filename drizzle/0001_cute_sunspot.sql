ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "items_category_idx";--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "unit_cost" numeric(12, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "total_cost" numeric(14, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "description" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "stock_no" varchar(255);--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "unit_cost" numeric(12, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "stock_cards" ADD COLUMN "running_total_cost" numeric(14, 2);--> statement-breakpoint
CREATE INDEX "items_stock_no_idx" ON "items" USING btree ("stock_no");--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "category_id";