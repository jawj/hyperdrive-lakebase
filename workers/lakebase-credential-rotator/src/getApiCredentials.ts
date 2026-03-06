export async function getDatabricksApiCredentials(
  oidcUrl: string,
  clientId: string,
  clientSecret: string
) {
  console.info(`${new Date().toISOString()} Fetching API auth token ...`);
  
  const t0 = Date.now();
  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(oidcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=all-apis', // there's currently no Lakebase-specific scope
  });

  if (!response.ok) {
    const errorMessage = `${response.status} ${response.statusText}: ${await response.text()}`;
    throw new Error(`Couldn't get Databricks API OAuth token: ${errorMessage}`);
  }

  const credentials: any = await response.json();
  const token: string = credentials.access_token;
  const expires = new Date(t0 + 1000 * credentials.expires_in); // expires_in is in seconds
  
  console.info(`${new Date().toISOString()} Lakebase API auth token fetched, expires around ${expires.toISOString()}`);
  return { token, expires };
}
