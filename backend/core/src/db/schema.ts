import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Define types
export type ProviderModelsType = Array<{ label: string; value: string }>;

export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  providerName: text("provider_name").notNull().unique(),
  nickName: text("nickname").notNull(),
  modelType: text("type").notNull(),
  default: integer("default").notNull().default(0),
  apiKey: text("api_key").notNull(),
  baseUrl: text("base_url"),
  availableModels: text("available_models"),
  createdAt: integer("created_at")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});
