import { type CoreMessage } from "ai";

export interface GenerateTextRequest {
  model: string;
  prompt: string;
  messages?: CoreMessage[];
  tools?: any;
  toolChoice?: any
}