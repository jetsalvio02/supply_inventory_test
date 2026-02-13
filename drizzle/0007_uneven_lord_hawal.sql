CREATE TABLE "ris_request_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"item_id" integer,
	"stock_no" varchar(255),
	"unit" varchar(50),
	"name" varchar(255),
	"description" text,
	"quantity" integer NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "ris_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"purpose" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ris_request_items" ADD CONSTRAINT "ris_request_items_request_id_ris_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."ris_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ris_request_items" ADD CONSTRAINT "ris_request_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ris_requests" ADD CONSTRAINT "ris_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;