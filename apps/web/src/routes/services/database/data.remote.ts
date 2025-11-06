import { query } from "$app/server";
import { db } from "$lib/server/db";
import { ConversationSchema, MessageSchema, ToolSchema } from "@temporal-vercel-demo/database";

export const getStatus = query(async() => {
  try {
    const something = await db.select().from(ConversationSchema).limit(1);
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
});

export const reset = query(async() => {
  try {
    await db.execute(`TRUNCATE TABLE conversations, messages, tools`);
  } catch(e) {
    console.error(e);
    throw e;
  }
});