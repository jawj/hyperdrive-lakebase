import { required, type Env } from './env';
import { getDatabricksApiCredentials } from './getApiCredentials';
import { getLakebasePostgresCredentials } from './getPgCredentials';
import { setHyperdriveOrigin } from './setHyperdriveOrigin';

export function asErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function getLakebaseToken(env: Env) {
  const host = required(env, "DATABRICKS_HOST");
  const clientId = required(env, "DATABRICKS_CLIENT_ID");
  const clientSecret = required(env, "DATABRICKS_CLIENT_SECRET");
  const endpoint = required(env, "LAKEBASE_ENDPOINT");

  const oidcUrl = `https://${host}/oidc/v1/token`;
  const apiUrl = `https://${host}/api/2.0/postgres/credentials`;

  const apiCredentials = await getDatabricksApiCredentials(oidcUrl, clientId, clientSecret);
  const pgCredentials = await getLakebasePostgresCredentials(apiUrl, apiCredentials.token, endpoint);

  return pgCredentials.token;
}

async function rotateCredentials(env: Env): Promise<{
  started_at: string;
  completed_at: string;
  result: unknown;
}> {
  const startedAt = new Date();
  const origin = {
    user: required(env, "DATABRICKS_CLIENT_ID"),
    password: await getLakebaseToken(env),
    host: required(env, "LAKEBASE_HOST"),
    port: Number(env.LAKEBASE_PORT || "5432"),
    database: env.LAKEBASE_DATABASE || "databricks_postgres",
  };
  const result = await setHyperdriveOrigin(env, origin);
  return {
    started_at: startedAt.toISOString(),
    completed_at: new Date().toISOString(),
    result,
  };
}

export default {
  // triggered by cron
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      rotateCredentials(env)
        .then((data) => console.log("Credential rotation succeeded", data))
        .catch((err: unknown) => console.error("Credential rotation failed", err)),
    );
  },

  // web requests for testing: disable in production
  async fetch(request, env) {
    const testPath = env.TESTING_REQUEST_PATH;
    const url = new URL(request.url);

    try {
      const result = await rotateCredentials(env);
      return Response.json(result);

    } catch (err: unknown) {
      return Response.json(
        { error: asErrorMessage(err) },
        { status: 500 },
      );
    }
  },
} satisfies ExportedHandler<Env>;
