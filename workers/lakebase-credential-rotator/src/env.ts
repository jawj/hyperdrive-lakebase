export interface Env {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;

  HYPERDRIVE_CONFIG_ID?: string;

  DATABRICKS_HOST?: string;
  DATABRICKS_CLIENT_ID?: string;
  DATABRICKS_CLIENT_SECRET?: string;

  LAKEBASE_ENDPOINT?: string;
  LAKEBASE_HOST?: string;
  LAKEBASE_PORT?: string;
  LAKEBASE_DATABASE?: string;

  TESTING_REQUEST_PATH?: string;
}

export function required(env: Env, key: keyof Env): string {
  const value = env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}
