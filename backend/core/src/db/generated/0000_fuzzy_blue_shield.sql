CREATE TABLE "provider_models" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "provider_models_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "provider_models_model_id_unique" UNIQUE("model_id"),
	CONSTRAINT "provider_id_model_id_unique" UNIQUE("provider_id","model_id")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "providers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"base_url" varchar(255),
	"api_key" text NOT NULL,
	"image_url" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"iv" text NOT NULL,
	CONSTRAINT "providers_name_unique" UNIQUE("name"),
	CONSTRAINT "providers_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
ALTER TABLE "provider_models" ADD CONSTRAINT "provider_models_provider_id_providers_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id") ON DELETE cascade ON UPDATE no action;