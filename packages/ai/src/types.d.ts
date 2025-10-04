import { ModelMessage, type CoreMessage } from "ai";

export interface GenerateTextRequest {
  model: string;
  prompt?: string;
  messages?: ModelMessage[];
  tools?: any;
  toolChoice?: any
}