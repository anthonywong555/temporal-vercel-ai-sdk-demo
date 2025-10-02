/**
 * Get the runtime env value
 * @param env runtime env
 * @param key 
 * @param defaultValue 
 * @returns 
 */
export function getEnv(
  env: any,
  key: string,
  defaultValue?: string
): string {
  const value = env[key];

  if (value !== undefined) {
    return value;
  }

  if (defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return defaultValue;
}