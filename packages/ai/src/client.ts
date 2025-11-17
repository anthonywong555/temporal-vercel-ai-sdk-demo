import { Context, CancelledFailure, heartbeat, cancellationSignal, log } from "@temporalio/activity";
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { streamText, generateText, LanguageModel, jsonSchema, stepCountIs, ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { GenerateTextRequest } from "./types";
import { trace, context } from "@opentelemetry/api";
import { DrizzleClient, type Message } from "@temporal-vercel-demo/database";
import { TEMPORAL_BOT } from "@temporal-vercel-demo/common";
import {
  experimental_createMCPClient as createMCPClient,
  experimental_MCPClient as MCPClient,
} from '@ai-sdk/mcp';
import { z } from 'zod';

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

  async aiStreamTextCancellable(aRequest: GenerateTextRequest) {
    let messageId = '';
    let content = '';
    try {
      const tracer = trace.getTracer('@temporalio/interceptor-workflow');
      const { model, prompt = '', messages = [], tools = {}, toolChoice } = aRequest;
      let targetModel:LanguageModel;

      const activityContext = Context.current();

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
        },
        abortSignal: cancellationSignal(),
        onAbort: async() => {
          log.info(`onAbort: Cancelled Activity`);
          await this.drizzleClient.updateMessage(
            {
              content: content + ` ---- onAbort: LLM Chat is cancelled.`
            },
            messageId
          );
        }
      });

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
          heartbeat(chunk);
          
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
    } catch(e) {
      //@ts-ignore
      log.error(`catch `, {message: e.message});
      if(e instanceof CancelledFailure) {
        log.error(`catch Cancelled Activity`, {message: e.message});
        await this.drizzleClient.updateMessage(
          {
            content: content + ` ---- catch: LLM Chat is cancelled.`
          },
          messageId
        );
      }
      throw e;
    }
  }

  async aiStreamTextMCPHttp(aRequest: GenerateTextRequest) {
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { model, prompt = '', messages = [] } = aRequest;

    // TODO: Make this more dynamic
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    const transport = new StreamableHTTPClientTransport(
      new URL('http://localhost:4321/mcp')
    );

    const mcpClient:MCPClient = await createMCPClient({
      transport
    });

    const tools = await mcpClient.tools();
    
    const result = await streamText({
      model: targetModel,
      //@ts-ignore
      tools,
      ...(messages.length > 0 ? { messages }: {prompt}),
      stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    });

    const activityContext = Context.current();
    let messageId = '';
    let content = '';

    for await (const chunk of result.textStream) {
      content += chunk;

      // TODO: Ideally use upsert, but getting some 🐞.
      if(messageId === '') {
        const initalMessage = await this.drizzleClient.createMessage(
          {
            conversationId: activityContext.info.workflowExecution.workflowId,
            sender: 'assistant',
            content,
            avatar: "https://github.com/shadcn.png",
            name: TEMPORAL_BOT
          }
        );

        messageId = initalMessage[0].id;
        
      } else {
        await this.drizzleClient.updateMessage(
          {
            content
          },
          messageId
        );
      }
    }

    await mcpClient.close();

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

  transformMessageIntoAIMessage(messagesDB: Message[]):ModelMessage[] {
    const aiMessageHistory = messagesDB.map((messageDB) => {
      const { sender, content } = messageDB;
      return {
        role: sender,
        content: content
      }
    });
    //@ts-ignore ¯\_(ツ)_/¯
    return aiMessageHistory;
  }

  async streamTextMCPStdio(aRequest: GenerateTextRequest) {
    const tracer = trace.getTracer('@temporalio/interceptor-workflow');
    const { model, prompt = '', messages = [] } = aRequest;

    // TODO: Make this more dynamic
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
      args: ['apps/mcp-stdio/dist/server.js'],
    });

    const mcpClient:MCPClient = await createMCPClient({
      transport: stdioTransport
    });

    const result = await streamText({
      model: targetModel,
      //@ts-ignore
      tools: await mcpClient.tools({
        schemas: {
          'get-pokemon': {
            inputSchema: z.object({ name: z.string() }),
          },
        },
      }),
      ...(messages.length > 0 ? { messages }: {prompt}),
      stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    });

    const activityContext = Context.current();
    let messageId = '';
    let content = '';

    for await (const chunk of result.textStream) {
      content += chunk;

      // TODO: Ideally use upsert, but getting some 🐞.
      if(messageId === '') {
        const initalMessage = await this.drizzleClient.createMessage(
          {
            conversationId: activityContext.info.workflowExecution.workflowId,
            sender: 'assistant',
            content,
            avatar: "https://github.com/shadcn.png",
            name: TEMPORAL_BOT
          }
        );

        messageId = initalMessage[0].id;
        
      } else {
        await this.drizzleClient.updateMessage(
          {
            content
          },
          messageId
        );
      }
    }

    await mcpClient.close();

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