import { z, ZodObject, ZodType } from "zod/v4";

export const ChatCreateRequestSchema = z.object({
  id: z.string().describe('Chat Id.'),
  prompt: z.string().describe('The user inital prompt.'),
  workflowType: z.string().describe('The workflow type to use with the prompt.')
});

export const CreateWorkflowRequest = z.object({
  id: z.string().describe('Workflow Id.'),
  workflowType: z.string().describe('The workflow type to use with the prompt.'),
  args: z.any(),
});

export const UpdateWithStartRequest = z.object({
  id: z.string().describe('Workflow Id'),
  workflowType: z.string().describe('The workflow type to execute.'),
  workflowArgs: z.any().describe('Workflow Payload'),
  updateDef: z.string().describe('The workflow update definition'),
  updateArgs: z.any().describe('Workflow Update Payloads')
})

export interface ExecuteToolRequest {
  tool: string;
  toolId: string;
  args: any;
}

export interface PromptRequest {
  prompt: string;
}

export interface PromptRequest {
  chatSlidingWindowInSecs?: number;
  waitingForUserResponseInMins?: number;
  messageHistory?: Array<any>;
  isCAN: boolean;
}

export interface LLMMessageUpdate {
  role: string;
  content: string;
}

// Source: https://github.com/colinhacks/zod/issues/2807#issuecomment-2803504922
type SchemaFromInterface<T> = ZodObject<{
 [K in keyof Partial<T>]: K extends keyof T ? ZodType<T[K]> : never;
}>;

export interface BuyPlaneTicketRequest {
  fromCity: string;
  toCity: string;
}

export const BuyPlaneTicketSchema = z.object({
  fromCity: z.string().describe('Location from the city to depart.'),
  toCity: z.string().describe('Location to the city to arrive.')
}) satisfies SchemaFromInterface<BuyPlaneTicketRequest>;

export interface BuyPlaneTicketResponse {
  success: boolean;  
}

export interface BookHotelRequest {
  toCity: string;
}

export const BookHotelSchema = z.object({
  toCity: z.string().describe("Location to book a hotel")
}) satisfies SchemaFromInterface<BookHotelRequest>;

export interface BookHotelResponse {
  success: boolean;
}

export interface RentCarRequest {
  toCity: string;
}

export const RentCarSchema = z.object({
  toCity: z.string().describe("Location to book a rental car.")
}) satisfies SchemaFromInterface<RentCarRequest>;

export interface RentCarResponse {
  success: boolean;
}

export interface WeatherRequest {
  location: string;
}

export const WeatherSchema = z.object({
  location: z.string().describe("The location to get the weather for")
}) satisfies SchemaFromInterface<WeatherRequest>;

export interface WeatherResponse {
  location: string;
  temperature: number;
}

export interface AttractionsRequest extends WeatherResponse {}

export const AttractionsSchema = z.object({
  location: z.string().describe('The location to get the attractions for'),
  temperature: z.number().describe('The current temperature in Fahrenheit')
}) satisfies SchemaFromInterface<AttractionsRequest>;

export interface AttractionsResponse {
  text: string;
}

export interface LocationResponse {
  city: string;
}

export interface WeatherInformationRequest extends LocationResponse{}

export const WeatherInformationSchema = z.object({
  city: z.string().describe('The city weather the user lives.'),
}) satisfies SchemaFromInterface<WeatherInformationRequest>;