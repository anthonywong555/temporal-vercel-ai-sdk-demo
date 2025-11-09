import { log, sleep } from "@temporalio/activity";
import { ExecuteToolRequest } from "@temporal-vercel-demo/common";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { ToolSchema } from "@temporal-vercel-demo/database";
import * as tools from './tools';
import { experimental_createMCPClient } from '@ai-sdk/mcp';

// Define a type that represents the tools module with string indexing
type ToolsModule = {
  [key: string]: (...args: any[]) => Promise<any>;
};

// Cast tools to the ToolsModule type
const toolsWithIndex = tools as unknown as ToolsModule;


const dbURL = process.env.DATABASE_URL ? process.env.DATABASE_URL : '';
const dbClient = drizzle(dbURL);

export async function executeTool(request: ExecuteToolRequest) {
  const { tool, toolId, args } = request;

  log.info(`Starting tool execution: ${tool}`);

  try {
    // Save in DB
    await dbClient
      .update(ToolSchema)
      .set({ state: 'input-available' })
      .where(eq(ToolSchema.id, toolId));

    // Add artificial sleep
    await sleep('5 sec');

    // Call the related tool based on tool value.
    if(typeof toolsWithIndex[tool] === 'function') {
      const result = await toolsWithIndex[tool](args, toolId);
      log.info(result);
      await dbClient
        .update(ToolSchema)
        .set({ state: 'output-available', output: result })
        .where(eq(ToolSchema.id, toolId));

      return result;
    } else {
      throw new Error(`${tool} tool is not found`);
    }

  } catch(e) {
    if(e instanceof Error) {
      await dbClient
        .update(ToolSchema)
        .set({ state: 'output-error', errorText: e.message })
        .where(eq(ToolSchema.id, toolId));

      return e;
    }
  }
}

export async function getMCPTools(url: string):Promise<any> {
  const transport = new StreamableHTTPClientTransport(
    new URL(url),
  );

  const mcpClient = await experimental_createMCPClient({
    transport,
  });

  
  const mcpToolsResults = await mcpClient.tools();
  const tools:any = JSON.parse(JSON.stringify(mcpToolsResults));
  for (const actionKey in tools) {
    const params = tools[actionKey].parameters;
    if (params && params.jsonSchema) {
      tools[actionKey].parameters = { ...params.jsonSchema };
    }
  }


  return tools; 
}
