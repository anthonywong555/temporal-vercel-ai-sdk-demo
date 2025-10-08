import { drizzleZeroConfig } from "drizzle-zero";
import * as drizzleSchema from "@temporal-vercel-demo/database";

// See: https://github.com/0xcadams/drizzle-zero?tab=readme-ov-file#customize-with-drizzle-zeroconfigts

export const schema = drizzleZeroConfig(drizzleSchema, {
  tables: {
    conversations: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true
    },
    messages: {
      id: true,
      conversationId: true,
      sender: true,
      content: true,
      avatar: true,
      name: true,
      createdAt: true
    },
    tools: {
      id: true,
      messageId: true,
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
