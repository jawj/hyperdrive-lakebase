interface LakebaseCredentials {
  token: string;
  expire_time: string;
}

export async function getLakebasePostgresCredentials(
  apiUrl: string,
  apiToken: string | (() => string | Promise<string>),
  endpoint: string,
  params: { claims?: any[]; expire_time?: string; group_name?: string; ttl?: string; } = {}
) {
  console.info(`${new Date().toISOString()} Fetching Lakebase Postgres auth token ...`);

  if (typeof apiToken === 'function') apiToken = await apiToken();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ 
      ...params,
      endpoint,
    }),
  });

  if (!response.ok) {
    const errorMessage = `${response.status} ${response.statusText}: ${await response.text()}`;
    throw new Error(`Couldn't get Lakebase Postgres OAuth token: ${errorMessage}`);
  }

  const credentials: LakebaseCredentials = await response.json();
  const { token } = credentials;
  const expires = new Date(credentials.expire_time); // expire_time is an ISO8601 string

  console.info(`${new Date().toISOString()} Lakebase Postgres auth token fetched, expires at ${expires.toISOString()}`);
  return { token, expires };
}
