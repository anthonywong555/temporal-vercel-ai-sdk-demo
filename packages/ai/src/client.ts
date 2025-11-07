import { randomUUID } from 'crypto';
import { Context, CancelledFailure, heartbeat, log } from "@temporalio/activity";
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { streamText, generateText, LanguageModel, jsonSchema, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { GenerateTextRequest } from "./types";
import { trace, context } from "@opentelemetry/api";
import { DrizzleClient } from "@temporal-vercel-demo/database";
import { GetPokemonSchema, TEMPORAL_BOT } from "@temporal-vercel-demo/common";
import {
  experimental_createMCPClient as createMCPClient,
  experimental_MCPClient as MCPClient,
} from '@ai-sdk/mcp';

export const PROVIDER_OPEN_AI = 'OPEN_AI';
export const PROVIDER_ANTHROPIC = 'ANTHROPIC';

export class InvalidProviderError extends Error {
  constructor() {
    super('Provider supplied is invalid');
  }
}

export class AIClient {
  provider: string;
  drizzleClient: DrizzleClient

  constructor(provider: string, dr: DrizzleClient) {
    this.provider = provider;
    this.drizzleClient = dr;
  }

  formatTools(tools:any = {}) {
    const formattedTools:any = {};
    for(const atool of Object.keys(tools)) {
      // Copy the info over
      formattedTools[atool] = tools[atool];

      // Format the parameters into JSON Schema
      if(tools[atool].inputSchema && !tools[atool].inputSchema.jsonSchema) {
        formattedTools[atool].inputSchema = jsonSchema(tools[atool].inputSchema);   
      }
    }
    return formattedTools;
  }

  async streamTextHTTP(aRequest: GenerateTextRequest) {
    /*
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { model, prompt = '', messages = [], toolChoice } = aRequest;
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    const transport = new StreamableHTTPClientTransport(
      new URL('http://localhost:1234/mcp')
    );

    const mcpClient:MCPClient = await createMCPClient({
      transport
    });

    const tools = await mcpClient.tools();

    if(tools) {
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        tools,
        stopWhen: stepCountIs(1),
        system: '',
        prompt: '',
        experimental_telemetry: {
          tracer
        }
      });
    }

    /*
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { model, prompt = '', messages = [], toolChoice } = aRequest;
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    const transport = new StreamableHTTPClientTransport(
      new URL('http://localhost:1234/mcp')
    );

    const mcpClient:MCPClient = await createMCPClient({
      transport
    });

    const tools = await mcpClient.tools();

    if(tools) {
      await generateText({
        model: targetModel,
        tools,
        system: '',
        prompt: ''
      })
    }
    
    const result = await streamText({
      model: targetModel,
      tools,
      messages,
      stopWhen: stepCountIs(2),
      ///stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    });

   await mcpClient?.close();
   //await stdioTransport.close();

    const activityContext = Context.current();
    //const id = randomUUID();
    let messageId = ''
    let content = ''
    for await (const chunk of result.textStream) {
      content += chunk;

      // TODO: Ideally use upsert, but getting some 🐞.
      if(messageId === '') {
        const test = await this.drizzleClient.createMessage(
          {
            conversationId: activityContext.info.workflowExecution.workflowId,
            sender: 'assistant',
            content,
            avatar: "https://github.com/shadcn.png",
            name: TEMPORAL_BOT
          }
        );

        messageId = test[0].id;
        
      } else {
        await this.drizzleClient.updateMessage(
          {
            content
          },
          messageId
        );
      }
    }
    const reasoning = await result.reasoning;
    const reasoningText = await result.reasoningText;
    const finishReason = await result.finishReason;
    const responseMessages = (await result.response).messages;
    const toolCalls = await result.toolCalls;
    // Format the response
    return JSON.parse(JSON.stringify({
      finishReason,
      responseMessages,
      toolCalls,
      reasoning,
      reasoningText
    }));
    */
   return {};
  }

  async streamTextMCPStdio(aRequest: GenerateTextRequest) {
    /*
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { conversationId, model } = aRequest;
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    const stdioTransport = new StdioClientTransport({
      command: 'node',
      args: ["../mcp-stdio/dist/server.js"]
    });

    //await stdioTransport.start();

    const mcpClient = await createMCPClient({
      transport: stdioTransport
    });


    const result = await generateText({
      model: targetModel,
      tools: await mcpClient.tools({
        schemas: {
          'get-pokemon': {
            inputSchema: GetPokemonSchema
          }
        }
      }),
      messages: [],
      stopWhen: stepCountIs(1),
      ///stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    });

   await mcpClient?.close();
   //await stdioTransport.close();

    const activityContext = Context.current();
    //const id = randomUUID();
    let messageId = ''
    let content = ''
    for await (const chunk of result.textStream) {
      content += chunk;

      // TODO: Ideally use upsert, but getting some 🐞.
      if(messageId === '') {
        const test = await this.drizzleClient.createMessage(
          {
            conversationId: activityContext.info.workflowExecution.workflowId,
            sender: 'assistant',
            content,
            avatar: "https://github.com/shadcn.png",
            name: TEMPORAL_BOT
          }
        );

        messageId = test[0].id;
        
      } else {
        await this.drizzleClient.updateMessage(
          {
            content
          },
          messageId
        );
      }
    }
    const reasoning = await result.reasoning;
    const reasoningText = await result.reasoningText;
    const finishReason = await result.finishReason;
    const responseMessages = (await result.response).messages;
    const toolCalls = await result.toolCalls;
    // Format the response
    return JSON.parse(JSON.stringify({
      finishReason,
      responseMessages,
      toolCalls,
      reasoning,
      reasoningText
    }));
   return {};
   */
  }

  async streamText(aRequest: GenerateTextRequest) {
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { model, prompt = '', messages = [], tools = {}, toolChoice } = aRequest;
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    const result = await streamText({
      model: targetModel,
      tools: this.formatTools(tools),
      ...(messages.length > 0 ? {messages} : {prompt}),
      stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    });

    const activityContext = Context.current();
    //const id = randomUUID();
    let messageId = ''
    let content = ''
    for await (const chunk of result.textStream) {
      content += chunk;

      // TODO: Ideally use upsert, but getting some 🐞.
      if(messageId === '') {
        const test = await this.drizzleClient.createMessage(
          {
            conversationId: activityContext.info.workflowExecution.workflowId,
            sender: 'assistant',
            content,
            avatar: "https://github.com/shadcn.png",
            name: TEMPORAL_BOT
          }
        );

        messageId = test[0].id;
        
      } else {
        await this.drizzleClient.updateMessage(
          {
            content
          },
          messageId
        );
      }
    }
    const reasoning = await result.reasoning;
    const reasoningText = await result.reasoningText;
    const finishReason = await result.finishReason;
    const responseMessages = (await result.response).messages;
    const toolCalls = await result.toolCalls;

    // Format the response
    return JSON.parse(JSON.stringify({
      finishReason,
      responseMessages,
      toolCalls,
      reasoning,
      reasoningText
    }));
  }

  async generateText(aRequest: GenerateTextRequest) {
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { model, prompt = '', messages = [], tools = {}, toolChoice } = aRequest;
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    // TODO: Figure out how to handle failover
    
    const result = await generateText({
      model: targetModel,
      tools: this.formatTools(tools),
      ...(messages.length > 0 ? {messages} : {prompt}),
      // 
      stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    });

    const finishReason = await result.finishReason;
    const responseMessages = (await result.response).messages;
    const toolCalls = await result.toolCalls;
    // Format the response
    return JSON.parse(JSON.stringify({
      finishReason,
      responseMessages,
      toolCalls
    }))

  }
}