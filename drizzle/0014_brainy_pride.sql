ALTER TABLE "departments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "office_heads" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "departments" CASCADE;--> statement-breakpoint
DROP TABLE "office_heads" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_office_head_id_office_heads_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_department_id_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "office_head" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" varchar(255);--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "office_head_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "department_id";