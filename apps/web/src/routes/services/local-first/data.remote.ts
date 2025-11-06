import { PUBLIC_ZERO_SERVER } from "$env/static/public";
import { query } from "$app/server";

export const getStatus = query(async() => {
  try {
    const response = await fetch(PUBLIC_ZERO_SERVER);
    return response.ok;
  } catch(e) { 
    console.error(e);
    return false;
  }
})