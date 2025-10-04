import { z, ZodObject, ZodType } from "zod/v4";

export interface PromptRequest {
  prompt: string;
}

// Source: https://github.com/colinhacks/zod/issues/2807#issuecomment-2803504922
type SchemaFromInterface<T> = ZodObject<{
 [K in keyof Partial<T>]: K extends keyof T ? ZodType<T[K]> : never;
}>;

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