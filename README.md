# hyperdrive-lakebase workers


This repo contains two Cloudflare Workers:

1. `workers/lakebase-credential-rotator`
   
   A cron-triggered worker that fetches short-lived Databricks Lakebase Postgres credentials and updates a Cloudflare Hyperdrive configuration.

2. `workers/lakebase-connection-test`
   
   A tiny HTTP worker that runs `SELECT now()` over Hyperdrive and returns JSON.


## Prerequisites

- Node.js 20+
- `pnpm`
- `wrangler` CLI authenticated to your Cloudflare account
- A Databricks service principal with OAuth client credentials and permission to generate Lakebase DB credentials


## Install dependencies

```bash
pnpm -r install
```


## Worker 1: rotates Hyperdrive origin credentials

Path: `cd workers/lakebase-credential-rotator`

Copy `wrangler.toml.example` to `wrangler.toml` and set:

- `CLOUDFLARE_ACCOUNT_ID`
- `HYPERDRIVE_CONFIG_ID`

- `DATABRICKS_HOST` (example: `dbc-xxxxxxxx-xxxx.cloud.databricks.com`)
- `DATABRICKS_CLIENT_ID`

- `LAKEBASE_ENDPOINT` (`name` from `databricks postgres list-endpoints`, format: `projects/<id>/branches/<id>/endpoints/<id>`)
- `LAKEBASE_HOST`
- `LAKEBASE_PORT` (default `5432`)
- `LAKEBASE_DATABASE` (default `databricks_postgres`)

Then configure the secrets:

```bash
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put DATABRICKS_CLIENT_SECRET
```

### Cron schedule

Credentials are valid for 60 minutes. The default refresh schedule is every 20 minutes, which makes the system robust to any single failed refresh.

```toml
crons = ["8,28,48 * * * *"]
```

### Deploy

```bash
pnpm run deploy
```

### Web access

Ensure `workers_dev = false` in `wrangler.toml` to prevent public access.

You can set it `true` temporarily for debugging/test purposes. Then you would do:

```bash
curl "https://<your-worker-subdomain>/"
```

And the expected result should be similar to:

```json
{
  "started_at": "2026-03-06T10:50:39.226Z",
  "completed_at": "2026-03-06T10:50:43.298Z",
  "result": {
    "id": "03100116588d4a36b24a3e560617aca8",
    "name": "lakebase-rotation-example",
    "origin": {
      "host": "ep-xyz.database.us-west-2.cloud.databricks.com",
      "port": 5432,
      "database": "databricks_postgres",
      "scheme": "postgres",
      "user": "09adf6b1-b608-4ee5-9ee7-4479d8fff0c3"
    },
    "origin_connection_limit": 60,
    "caching": {
      "disabled": false
    },
    "mtls": {},
    "created_on": "2026-03-03T17:57:39.493273Z",
    "modified_on": "2026-03-06T10:50:41.608703Z"
  }
}
```

## Worker 2: Connection test app

Path: `cd workers/lakebase-connection-test`

### Configure Hyperdrive binding

Copy `wrangler.toml.example` to `wrangler.toml` and set:

- `[[hyperdrive]].id` to your Hyperdrive config ID

### Deploy

```bash
pnpm run deploy
```

### Test endpoint

```bash
curl "https://<your-worker-subdomain>/"
```

Expected result:

```json
{"server_time":"2026-03-03T00:00:00.000Z"}
```
