import { Client } from "pg";

interface Env { HYPERDRIVE?: { connectionString?: string } }

function res(json: any, status = 200) {
  return Response.json(json, { status });
}

export default {
  async fetch(_req, env, ctx) {
    const { HYPERDRIVE } = env;
    if (!HYPERDRIVE) return res({ error: "Missing HYPERDRIVE binding" }, 500);

    const { connectionString } = HYPERDRIVE;
    if (!connectionString) return res({ error: "Missing connectionString" }, 500);
    
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: true } });
    try {
      await client.connect()
      const { rows: [row] } = await client.query("SELECT now() AS server_time");
      return res(row);

    } catch (error: unknown) {
      return res({ error }, 500);

    } finally {
      ctx.waitUntil(client.end());
    }
  },
} satisfies ExportedHandler<Env>;
