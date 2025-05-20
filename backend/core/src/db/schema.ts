import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  varchar,
  boolean,
  unique,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  provider_id: varchar("provider_id", { length: 255 }).notNull().unique(),
  base_url: varchar("base_url", { length: 255 }),
  api_key: text("api_key").notNull(),
  image_url: varchar("image_url", { length: 255 }),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
  iv: text("iv").notNull(),
});

export const providerModels = pgTable(
  "provider_models",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    provider_id: varchar("provider_id", { length: 255 })
      .notNull()
      .references(() => providers.provider_id, {
        onDelete: "cascade",
      }),
    model_id: varchar("model_id", { length: 255 }).notNull().unique(),
    created_at: timestamp("created_at").default(sql`now()`),
    updated_at: timestamp("updated_at").default(sql`now()`),
    is_default: boolean("is_default").notNull().default(false),
    is_enabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => {
    return {
      providerSdkIdModelSdkIdUnique: unique("provider_id_model_id_unique").on(
        table.provider_id,
        table.model_id
      ),
    };
  }
);
