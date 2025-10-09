import { activityInfo, log, sleep } from "@temporalio/activity";
import { AttractionsRequest, AttractionsResponse, LocationResponse, WeatherInformationRequest, WeatherRequest, WeatherResponse } from "@temporal-vercel-demo/common";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { ToolSchema } from "@temporal-vercel-demo/database";

const dbURL = process.env.DATABASE_URL ? process.env.DATABASE_URL : '';
const dbClient = drizzle(dbURL);

export async function weather(request: WeatherRequest, toolId: string):Promise<WeatherResponse> {
  const {location} = request;
  
  await dbClient
    .update(ToolSchema)
    .set({ state: 'input-available' })
    .where(eq(ToolSchema.id, toolId));

  await sleep('10 sec');

  return {
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10
  }
}

export async function attractions(request: AttractionsRequest, toolId: string): Promise<AttractionsResponse> {
  await dbClient
    .update(ToolSchema)
    .set({ state: 'input-available' })
    .where(eq(ToolSchema.id, toolId));

  const {location, temperature} = request;
  const context = activityInfo();
  const { attempt } = context;

  const result = await generateText({
    model: attempt % 2 === 0 ? openai('gpt-4o-mini') : anthropic('claude-3-5-haiku-latest'),
    prompt: `What are 3 attractions in ${location} that I should see given it is ${temperature} outside?`
  });

  return {text: result.text};
}

export async function getLocation():Promise<LocationResponse> {
  return {
    city: 'New York'
  }
}

export async function getWeatherInformation(request: WeatherInformationRequest) {
  const weatherOptions = [
    'sunny',
    'cloudy',
    'rainy',
    'snowy',
    'windy',
  ];
  return weatherOptions[
    Math.floor(Math.random() * weatherOptions.length)
  ];
}