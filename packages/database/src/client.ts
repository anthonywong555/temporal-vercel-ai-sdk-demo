import { drizzle, NodePgClient, NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { ColumnBaseConfig, ColumnDataType, eq, Placeholder, SQL, sql } from "drizzle-orm";
import { ConversationSchema, MessageSchema, ToolSchema } from "./schema";
import { PgInsertOnConflictDoUpdateConfig, PgInsertBase, PgTableWithColumns, PgColumn } from "drizzle-orm/pg-core";

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

  async createConversation(conversation: { state: SQL<unknown> | "active" | "closed" | Placeholder<string, any>; id?: string | SQL<unknown> | Placeholder<string, any> | undefined; title?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; createdAt?: SQL<unknown> | Date | Placeholder<string, any> | undefined; updatedAt?: SQL<unknown> | Date | Placeholder<string, any> | undefined; }) {
    return await this.db
      .insert(ConversationSchema)
      .values(conversation);
  }

  async updateConversation(
    conversation: { state?: SQL<unknown> | "active" | "closed" | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; id?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; title?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | null | undefined; createdAt?: SQL<unknown> | Date | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; updatedAt?: SQL<unknown> | Date | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; }, 
    conversationId: string) {
      return await this.db
        .update(ConversationSchema)
        .set(conversation)
        .where(eq(ConversationSchema.id, conversationId));
  }

  async createMessage(message: { conversationId: string | SQL<unknown> | Placeholder<string, any>; sender: SQL<unknown> | Placeholder<string, any> | "user" | "assistant" | "system"; id?: string | SQL<unknown> | Placeholder<string, any> | undefined; name?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; createdAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; content?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; avatar?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; }) {
    return await this.db
      .insert(MessageSchema)
      .values(message)
      .returning();
  }

  async updateMessage(
    message: { conversationId?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; sender?: SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | "user" | "assistant" | "system" | undefined; id?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; name?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | null | undefined; createdAt?: SQL<unknown> | Date | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | undefined; content?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | null | undefined; avatar?: string | SQL<unknown> | PgColumn<ColumnBaseConfig<ColumnDataType, string>, {}, {}> | null | undefined; },
    messageId: string
  ) {
    return await this.db
      .update(MessageSchema)
      .set(message)
      .where(eq(MessageSchema.id, messageId))
  }

  async upsertMessage(
    message: { conversationId: string | SQL<unknown> | Placeholder<string, any>; sender: SQL<unknown> | Placeholder<string, any> | "user" | "assistant" | "system"; id?: string | SQL<unknown> | Placeholder<string, any> | undefined; name?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; createdAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; content?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; avatar?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; },
    config: PgInsertOnConflictDoUpdateConfig<PgInsertBase<PgTableWithColumns<{ name: "messages"; schema: undefined; columns: { id: PgColumn<{ name: "id"; tableName: "messages"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; notNull: true; hasDefault: true; isPrimaryKey: true; isAutoincrement: false; hasRuntimeDefault: false; enumValues: undefined; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; conversationId: PgColumn<{ name: "conversation_id"; tableName: "messages"; dataType: "string"; columnType: "PgUUID"; data: string; driverParam: string; notNull: true; hasDefault: false; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: undefined; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; sender: PgColumn<{ name: "sender"; tableName: "messages"; dataType: "string"; columnType: "PgEnumColumn"; data: "user" | "assistant" | "system"; driverParam: string; notNull: true; hasDefault: false; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: ["user", "assistant", "system"]; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; content: PgColumn<{ name: "content"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: false; hasDefault: false; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: [string, ...string[]]; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; avatar: PgColumn<{ name: "avatar"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: false; hasDefault: false; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: [string, ...string[]]; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; name: PgColumn<{ name: "name"; tableName: "messages"; dataType: "string"; columnType: "PgText"; data: string; driverParam: string; notNull: false; hasDefault: false; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: [string, ...string[]]; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; createdAt: PgColumn<{ name: "created_at"; tableName: "messages"; dataType: "date"; columnType: "PgTimestamp"; data: Date; driverParam: string; notNull: true; hasDefault: true; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: undefined; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>; }; dialect: "pg"; }>, NodePgQueryResultHKT, undefined, undefined, false, never>>
  ) {
    return await this.db
      .insert(MessageSchema)
      .values(message)
      .onConflictDoUpdate(config)
  }

  async upsertTool(
    tool: { id: string | SQL<unknown> | Placeholder<string, any>; conversationId: string | SQL<unknown> | Placeholder<string, any>; type: string | SQL<unknown> | Placeholder<string, any>; messageId: string | SQL<unknown> | Placeholder<string, any>; state: SQL<unknown> | Placeholder<string, any> | "input-available" | "input-streaming" | "output-available" | "output-error"; createdAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; updatedAt?: SQL<unknown> | Placeholder<string, any> | Date | undefined; input?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; output?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; errorText?: string | SQL<unknown> | Placeholder<string, any> | null | undefined; },
    diffTool: any
  ) {
    return await this.db
      .insert(ToolSchema)
      .values(tool)
      .onConflictDoUpdate({
        target: ToolSchema.id,
        set: diffTool
      })
  }
}