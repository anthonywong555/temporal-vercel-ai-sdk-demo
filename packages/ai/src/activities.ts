import { AIClient } from "./client";

export function createAIActivities(anAIClient: AIClient) {
  return {
    aiGenerateText: anAIClient.generateText.bind(anAIClient),
    aiStreamText: anAIClient.streamText.bind(anAIClient),
    aiStreamTextMCP: anAIClient.streamTextMCP.bind(anAIClient),
    aiStreamTextMCPHttp: anAIClient.streamTextHTTP.bind(anAIClient)
  }
}