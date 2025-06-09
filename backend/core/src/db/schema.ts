import {
  integer,
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import * as authSchema from "../../auth-schema";
import { CoreMessage } from "ai";

export const aiProviders = pgTable("ai_providers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  provider: varchar({ length: 255 }).notNull(),
  baseUrl: varchar({ length: 255 }).notNull().unique(),
  apiKey: varchar({ length: 255 }).notNull().unique(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
  isSystem: boolean().notNull().default(false),
  isDisabled: boolean().notNull().default(false),
});

export const providerModels = pgTable("provider_models", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  providerId: integer()
    .notNull()
    .references(() => aiProviders.id),
  model: varchar({ length: 255 }).notNull(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
  isDefault: integer().notNull(),
  isDisabled: integer().notNull(),
});

export const conversations = pgTable("conversations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  externalId: text("external_chat_id").unique().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authSchema.user.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull().default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  externalId: text("external_message_id").unique().notNull(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.externalId, { onDelete: "cascade" }),
  content: jsonb().$type<CoreMessage[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => authSchema.user.id, { onDelete: "cascade" }),
  settings: jsonb().default("{}").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userAgents = pgTable("user_agents", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => authSchema.user.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  systemMessage: text("system_message").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export * from "../../auth-schema";

export type User = typeof authSchema.user.$inferSelect;
export type NewUser = typeof authSchema.user.$inferInsert;
export type Session = typeof authSchema.session.$inferSelect;
export type Account = typeof authSchema.account.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type UserAgent = typeof userAgents.$inferSelect;
export type NewUserAgent = typeof userAgents.$inferInsert;
