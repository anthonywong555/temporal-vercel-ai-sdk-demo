import { pgTable, text, pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

//Source: https://orm.drizzle.team/docs/sql-schema-declaration

export const messageSenderEnum = pgEnum("message_sender", [
  "user",
  "assistant",
  "system",
]);

export const toolStateEnum = pgEnum("tool_state", [
  "input-available",
  "input-streaming",
  "output-available",
  "output-error",
]);

export const cotStatusEnum = pgEnum("cot_status", [
  "pending",
  "active",
  "complete",
  "error",
]);

export const ConversationSchema = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- MESSAGES ---------- //

export const MessageSchema = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => ConversationSchema.id, { onDelete: "cascade" }),
  sender: messageSenderEnum("sender").notNull(),
  content: text("content"), // Message
  avatar: text("avatar"), // URL
  name: text("name"), // Anthony | Temporal Bot
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ToolSchema = pgTable("tools", {
  id: text("id").primaryKey(), // e.g. “call_1haVZ762VAUioNSpMEDDdLRe”
  messageId: uuid("message_id")
    .notNull()
    .references(() => MessageSchema.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => ConversationSchema.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // name of tool
  state: toolStateEnum("state").notNull(), 
  input: text("input"),
  output: text("output"),
  errorText: text("error_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});