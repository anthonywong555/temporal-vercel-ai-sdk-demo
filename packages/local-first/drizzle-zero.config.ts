import { drizzleZeroConfig } from "drizzle-zero";
import * as drizzleSchema from "@temporal-vercel-demo/database";

// See: https://github.com/0xcadams/drizzle-zero?tab=readme-ov-file#customize-with-drizzle-zeroconfigts

export const schema = drizzleZeroConfig(drizzleSchema, {
  tables: {
    ConversationSchema: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true
    },
    MessageSchema: {
      id: true,
      conversationId: true,
      sender: true,
      content: true,
      avatar: true,
      name: true,
      createdAt: true
    },
    ToolSchema: {
      id: true,
      messageId: true,
      conversationId: true,
      type: true,
      state: true,
      input: true,
      output: true,
      errorText: true,
      createdAt: true,
      updatedAt: true,
    }
  },
  casing: "snake_case"
})
