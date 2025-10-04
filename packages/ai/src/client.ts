import { Context, CancelledFailure, heartbeat } from "@temporalio/activity";
import { generateText, LanguageModel, jsonSchema, stepCountIs, type ModelMessage } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic, anthropic } from "@ai-sdk/anthropic";
import type { GenerateTextRequest } from "./types";
import { trace, context } from "@opentelemetry/api";


export const PROVIDER_OPEN_AI = 'OPEN_AI';
export const PROVIDER_ANTHROPIC = 'ANTHROPIC';

export class InvalidProviderError extends Error {
  constructor() {
    super('Provider supplied is invalid');
  }
}

export class AIClient {
  provider: string

  constructor(provider: string) {
    this.provider = provider;
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
    return await generateText({
      model: targetModel,
      tools: this.formatTools(tools),
      ...(messages.length > 0 ? {messages} : {prompt}),
      stopWhen: stepCountIs(1),
      experimental_telemetry: {
        tracer
      }
    })
  }
}