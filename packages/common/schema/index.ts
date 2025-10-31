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

export const UpdateRequest = z.object({
  id: z.string().describe('Workflow Id'),
  updateDef: z.string().describe('The workflow update definition'),
  updateArgs: z.any().describe('Workflow Update Payloads')
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

export interface AskForConfirmationRequest {
  message: string;
}

export interface AskForConfirmationResponse extends AskForConfirmationRequest {

};

export const AskForConfirmationSchema = z.object({
  message: z.string().describe('The message to ask for confirmation.')
}) satisfies SchemaFromInterface<AskForConfirmationRequest>;

export interface UndoBuyPlaneTicketRequest {
  fromCity: string;
  fromCountry: string;
  toCity: string;
  toCountry: string; 
}

export const UndoBuyPlaneTicketSchema = z.object({
  fromCity: z.string().describe('Location from the city to depart.'),
  fromCountry: z.string().describe('Location from the country to depart.'),
  toCity: z.string().describe('Location to the city to arrive.'),
  toCountry: z.string().describe('Location to the country to depart.'),
}) satisfies SchemaFromInterface<UndoBuyPlaneTicketRequest>;

export interface UndoBuyPlaneTicketResponse {
  success: boolean; 
}

export interface BuyPlaneTicketRequest {
  fromCity: string;
  fromCountry: string;
  toCity: string;
  toCountry: string; 
}

export const BuyPlaneTicketSchema = z.object({
  fromCity: z.string().describe('Location from the city to depart.'),
  fromCountry: z.string().describe('Location from the country to depart.'),
  toCity: z.string().describe('Location to the city to arrive.'),
  toCountry: z.string().describe('Location to the country to depart.'),
}) satisfies SchemaFromInterface<BuyPlaneTicketRequest>;

export interface BuyPlaneTicketResponse {
  success: boolean;  
}

export interface BookHotelRequest {
  toCity: string;
  toCountry: string;
}

export const BookHotelSchema = z.object({
  toCity: z.string().describe('The city to book a hotel'),
  toCountry: z.string().describe('The country to book a hotel')
}) satisfies SchemaFromInterface<BookHotelRequest>;

export interface UndoBookHotelRequest {
  toCity: string;
  toCountry: string;
}

export const UndoBookHotelSchema = z.object({
  toCity: z.string().describe('The city to book a hotel'),
  toCountry: z.string().describe('The country to book a hotel')
}) satisfies SchemaFromInterface<UndoBookHotelRequest>;

export interface UndoBookHotelResponse {
  success: boolean;
}

export interface BookHotelResponse {
  success: boolean;
}

export interface UndoRentCarRequest {
  toCity: string;
  toCountry: string;
}

export interface UndoRentCarResponse {
  success: boolean;
}

export const UndoRentCarSchema = z.object({
  toCity: z.string().describe('The city to book a rental car'),
  toCountry: z.string().describe('The country to book a rental car')
}) satisfies SchemaFromInterface<UndoBuyPlaneTicketRequest>;

export interface RentCarRequest {
  toCity: string;
  toCountry: string;
}

export const RentCarSchema = z.object({
  toCity: z.string().describe('The city to book a rental car'),
  toCountry: z.string().describe('The country to book a rental car')
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