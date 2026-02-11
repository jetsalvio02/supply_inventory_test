ALTER TABLE "suppliers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "suppliers" CASCADE;--> statement-breakpoint
ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_supplier_id_suppliers_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_transactions" DROP COLUMN "supplier_id";
