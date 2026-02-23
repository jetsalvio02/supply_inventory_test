CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_name" varchar(255),
	"reference_iar_no" varchar(255),
	"fund_cluster" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
