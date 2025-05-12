CREATE TABLE "provider_models" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "provider_models_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"provider_id" integer NOT NULL,
	"model_sdk_id" varchar(255) NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "provider_id_model_sdk_id_unique" UNIQUE("provider_id","model_sdk_id")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "providers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"provider_sdk_id" varchar(255) NOT NULL,
	"base_url" varchar(255),
	"api_key" varchar(255) NOT NULL,
	"image_url" varchar(255),
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "providers_name_unique" UNIQUE("name"),
	CONSTRAINT "providers_provider_sdk_id_unique" UNIQUE("provider_sdk_id")
);
--> statement-breakpoint
ALTER TABLE "provider_models" ADD CONSTRAINT "provider_models_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;