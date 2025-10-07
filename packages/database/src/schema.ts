import { relations, sql } from "drizzle-orm";
import { integer, pgTable, serial, text, uniqueIndex, pgEnum, timestamp, uuid, primaryKey, jsonb } from "drizzle-orm/pg-core";

//Source: https://orm.drizzle.team/docs/sql-schema-declaration

export const messageSenderEnum = pgEnum("message_sender", [
  "user",
  "assistant",
  "system",
]);

export const toolStateEnum = pgEnum("tool_state", [
  "input-available",
  "loading",
  "output-available",
  "output-error",
]);

export const cotStatusEnum = pgEnum("cot_status", [
  "pending",
  "active",
  "complete",
  "error",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------- MESSAGES ---------- //

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  sender: messageSenderEnum("sender").notNull(),
  content: text("content"), // Message
  avatar: text("avatar"), // URL
  name: text("name"), // Anthony | Temporal Bot
  createdAt: timestamp("created_at").defaultNow().notNull(),
});