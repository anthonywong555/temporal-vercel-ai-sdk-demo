import { DrizzleClient } from "./client";

export function createDrizzleActivites(drizzleClient: DrizzleClient) {
  return {
    sql: drizzleClient.sql.bind(drizzleClient),
    testError: drizzleClient.testError.bind(drizzleClient),
    createConversation: drizzleClient.createConversation.bind(drizzleClient),
    updateConversation: drizzleClient.updateConversation.bind(drizzleClient),
    createMessage: drizzleClient.createMessage.bind(drizzleClient),
    updateMessage: drizzleClient.updateMessage.bind(drizzleClient),
    upsertTool: drizzleClient.upsertTool.bind(drizzleClient)
  }
}