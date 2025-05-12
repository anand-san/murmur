import {
  integer,
  pgTable,
  varchar,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  provider_sdk_id: varchar("provider_sdk_id", { length: 255 })
    .notNull()
    .unique(),
  base_url: varchar("base_url", { length: 255 }),
  api_key: varchar("api_key", { length: 255 }).notNull(),
  image_url: varchar("image_url", { length: 255 }),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const providerModels = pgTable(
  "provider_models",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    provider_id: integer("provider_id")
      .notNull()
      .references(() => providers.id),
    model_sdk_id: varchar("model_sdk_id", { length: 255 }).notNull(),
    created_at: integer("created_at").notNull(),
    updated_at: integer("updated_at").notNull(),
    is_default: boolean("is_default").notNull().default(false),
    is_enabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => {
    return {
      providerIdModelSdkIdUnique: unique("provider_id_model_sdk_id_unique").on(
        table.provider_id,
        table.model_sdk_id
      ),
    };
  }
);
