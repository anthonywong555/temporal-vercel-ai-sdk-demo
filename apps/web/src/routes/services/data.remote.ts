import { query } from '$app/server';
import { getEnv } from "@temporal-vercel-demo/common";
import { getConnectionOptions } from "@temporal-vercel-demo/temporalio";
import { env } from "$env/dynamic/private";
import { Connection } from "@temporalio/client";

export const getTemporalStatus = query(async() => {
  // Doing a health check
  const conn = await Connection.connect(await getConnectionOptions(env));
  const response = await conn.healthService.check({});
  await conn.close();
  const healthCheck = JSON.parse(JSON.stringify(response));
  const { status } = healthCheck;

  return {
    status,
    canConnectToTemporal: status === 'SERVING',
    url: getEnv(env, 'TEMPORAL_BASE_URL', '')
  }
});
