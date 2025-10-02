import { generateText, LanguageModel, jsonSchema, stepCountIs } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic, anthropic } from "@ai-sdk/anthropic";
import type { GenerateTextRequest } from "./types";
import { Context } from "@temporalio/activity";

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

  async generateText(aRequest: GenerateTextRequest) {
    const { log } = Context.current();
    const { model, prompt, messages, tools, toolChoice } = aRequest;
    let targetModel:LanguageModel;

    if(this.provider === PROVIDER_ANTHROPIC) {
      targetModel = anthropic(model);
    } else if(this.provider === PROVIDER_OPEN_AI) {
      targetModel = openai(model);
    } else {
      throw new InvalidProviderError();
    }

    const formatTools:any = {};

    if(tools) {
      for(const atool of Object.keys(tools)) {

        // Copy the info over
        formatTools[atool] = tools[atool];

        // Format the parameters into JSON Schema
        if(tools[atool].parameters && !tools[atool].parameters.jsonSchema) {
          formatTools[atool].parameters = jsonSchema(tools[atool].parameters);   
        }
      }  
    }

    // TODO: Figure out how to handle failover
    return await generateText({
      model: targetModel,
      prompt,
      stopWhen: stepCountIs(1)
    })
  }
}