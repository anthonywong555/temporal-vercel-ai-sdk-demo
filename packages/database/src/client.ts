import { drizzle, NodePgClient, NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, Placeholder, SQL, sql } from "drizzle-orm";
import { conversations, messages } from "./schema";

export class DrizzleClient {
  db: NodePgDatabase<Record<string, never>> & {
    $client: NodePgClient;
  };

  constructor(databaseURL: string) {
    this.db = drizzle(databaseURL);
  }

  async sql(sqlQuery: string) {
    return await this.db.execute(sql.raw(sqlQuery));
  }

  async testError() {
    throw new Error(`Error`);
  }

  async createConversation(conversation: { id?: string | SQL<unknown> | Placeholder<string, any> | undefined; title?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; createdAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; updatedAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; }) {
    return await this.db
      .insert(conversations)
      .values(conversation);
  }

  async createMessage(message: { conversationId: string | SQL<unknown> | Placeholder<string, any>; sender: SQL<unknown> | Placeholder<string, any> | "user" | "assistant" | "system"; id?: string | SQL<unknown> | Placeholder<string, any> | undefined; name?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; createdAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; content?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; avatar?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; }) {
    return await this.db
      .insert(messages)
      .values(message)
  }
}