import { activityInfo } from "@temporalio/activity";
import { 
  AttractionsRequest, AttractionsResponse,
  BookHotelRequest, BookHotelResponse,
  UndoBookHotelRequest, UndoBookHotelResponse,
  BuyPlaneTicketRequest, BuyPlaneTicketResponse,
  UndoBuyPlaneTicketRequest, UndoBuyPlaneTicketResponse,
  RentCarRequest, RentCarResponse, 
  UndoRentCarRequest, UndoRentCarResponse,
  LocationResponse, WeatherInformationRequest, 
  WeatherRequest, WeatherResponse, 
  AskForConfirmationRequest,
  AskForConfirmationResponse
} from "@temporal-vercel-demo/common";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function askForConfirmation(request: AskForConfirmationRequest):Promise<AskForConfirmationResponse> {
  return request;
}

export async function buyPlaneTicket(request: BuyPlaneTicketRequest):Promise<BuyPlaneTicketResponse> {
  return {
    success: true
  }
}

export async function undoBuyPlaneTicket(request: UndoBuyPlaneTicketRequest):Promise<UndoBuyPlaneTicketResponse> {
  return {
    success: true
  }
}

export async function bookHotel(request: BookHotelRequest):Promise<BookHotelResponse> {
  return {
    success: true
  }
}

export async function undoBookHotel(request: UndoBookHotelRequest): Promise<UndoBookHotelResponse> {
  return {
    success: true
  }
}

export async function rentCar(request: RentCarRequest):Promise<RentCarResponse>{
  return {
    success: true
  }
}

export async function undoRentCar(request: UndoRentCarRequest):Promise<UndoRentCarResponse>{
  return {
    success: true
  }
}

export async function weather(request: WeatherRequest):Promise<WeatherResponse> {
  const { location } = request;

  return {
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10
  }
}

export async function attractions(request: AttractionsRequest): Promise<AttractionsResponse> {
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