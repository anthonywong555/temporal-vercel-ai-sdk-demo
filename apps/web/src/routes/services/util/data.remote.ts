import { query } from "$app/server";

// Get the IP address
async function getIP(): Promise<string> {
  const url = 'https://icanhazip.com';
  const response = await fetch(url);
  const data = await response.text();
  return data.trim();
}

// Use the IP address to get the location.
async function getLocationInfoBasedOnIP(ip: string): Promise<any> {
  const url = `http://ip-api.com/json/${ip}`;
  const response = await fetch(url);
  const data:any = await response.json();
  return data;
}

export const getLocationInfo = query(async() => {
  try {
    const ip = await getIP();
    const location = await getLocationInfoBasedOnIP(ip);
    return `${location.city}, ${location.regionName}, ${location.country}`;
  } catch {
    return 'Brooklyn, New York, United States';
  }
})