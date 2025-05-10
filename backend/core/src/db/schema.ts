import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
export const provider = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  provider: varchar({ length: 255 }).notNull(),
  baseUrl: varchar({ length: 255 }).notNull().unique(),
  apiKey: varchar({ length: 255 }).notNull().unique(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const providerModels = pgTable("models", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  providerId: integer()
    .notNull()
    .references(() => provider.id),
  model: varchar({ length: 255 }).notNull(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
  isDefault: integer().notNull(),
  isDisabled: integer().notNull(),
});
