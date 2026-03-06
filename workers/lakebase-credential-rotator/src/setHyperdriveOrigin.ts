import { required, type Env } from './env';

interface HyperdriveOrigin {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

interface HyperdriveApiResponse {
  success?: boolean;
  result?: unknown;
}

export async function setHyperdriveOrigin(env: Env, origin: HyperdriveOrigin): Promise<unknown> {
  const accountId = required(env, "CLOUDFLARE_ACCOUNT_ID");
  const apiToken = required(env, "CLOUDFLARE_API_TOKEN");
  const hyperdriveConfigId = required(env, "HYPERDRIVE_CONFIG_ID");
  
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/hyperdrive/configs/${hyperdriveConfigId}`;
  const result = await fetch(apiUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ origin }),
  });

  const payload: HyperdriveApiResponse = await result.json();
  if (!result.ok || !payload?.success) throw new Error(`${result.status} Hyperdrive update failed: ${JSON.stringify(payload)}`);

  return payload.result;
}