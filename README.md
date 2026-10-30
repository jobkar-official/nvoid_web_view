# Nvoid Web View

A Next.js user interface for the Nvoid AI Agent worker. This repository contains the user-facing workspace only; the job discovery, matching, queue, and browser automation engine live in [nvoid_ai_agent](https://github.com/jobkar-official/nvoid_ai_agent).

## Included

- Candidate profile form with clearly fictional default test details.
- Live search from Jobicy, Remote OK, Arbeitnow, Working Nomads, and Himalayas, with role/location filtering, provider attribution, original listing URLs, and publication dates when available.
- Optional Apify connectors for Naukri, LinkedIn Jobs, Indeed, Glassdoor, and Apna; optional Adzuna and Jooble API connectors when credentials are set.
- Synthetic demo data isolated from the default runtime configuration and used only by CI.
- Profile match scores and job cards.
- Agent run controls and application task history.
- Worker connection and MCP source status.
- Server-side Next.js API proxy to the agent, keeping the agent API key out of browser JavaScript.
- Review-only execution: every run sends `autoSubmit: false` and `syncToBackend: false`.

The candidate profile shown initially is fictional and stored only in browser state; it is not saved to a user database. Job search results are provider data, not generated demo listings. The seven default public feeds are checked against the chosen role and country/location eligibility before results reach the UI. Provider data is cached for 5–60 minutes depending on source, so the feed is current but not second-by-second streaming. Optional Naukri, LinkedIn, Indeed, Glassdoor, and Apna connectors activate when a private `APIFY_API_TOKEN` is configured in the agent's `.env`; Adzuna and Jooble activate when their own credentials are present. Third-party actors can charge per result plus platform usage. Public-board listings are not queued for automatic application unless a direct external application URL is provided. Keep submission in review-only mode.

## Live federated MCP research workspace

Open `/research` from the workspace navigation to run research questions across the worker's actual connected MCP servers. This is a separate workflow from the candidate job-search dashboard.

The page loads the worker's live MCP tool catalog, displays connected sources and safe read-only tools, accepts a natural-language query, and lets the user choose a maximum record count and tool-call budget. It calls the server-side `/api/agent/research` proxy, which invokes the worker's `/api/research/run` endpoint. The result view is generated from the real response and includes per-connector coverage, each actual tool invocation, failures, durations, returned records, deduplication totals, and JSON/CSV exports.

The UI does not contain a synthetic research dataset or a prefilled report. An empty result set remains empty and displays the source-call diagnostics. Tools marked destructive or non-read-only are not eligible for this workflow; the worker also blocks mutation-style operations by name.

Only MCP endpoints and credentials configured on the Nvoid worker can be used. Connections held privately inside ChatGPT or Claude are not automatically shared with this separate service. Configure an endpoint that Nvoid is authorized to access in the worker's `config/mcp-servers.json` and store its token in the worker's server environment. The dashboard reports only servers that have actually connected.

## Run locally

Use Node.js 22 or newer. Start the agent worker separately first. The documented development setup for the worker is in its own repository.

### 1. Start the agent worker

Clone and run the development branch of the agent project, configure a private `AGENT_API_KEY`, leave auto-submit disabled, and start its Docker services:

```bash
git clone https://github.com/jobkar-official/nvoid_ai_agent.git
cd nvoid_ai_agent
git checkout development
test -f .env || cp .env.example .env
```

Edit `.env` to set a strong random `AGENT_API_KEY`, keep `AUTO_SUBMIT_ENABLED=false`, and ensure `MCP_SERVERS_CONFIG=./config/mcp-servers.json` or leave it unset so the live sources are used. For the Docker route, then run:

```bash
docker compose up --build -d
curl http://127.0.0.1:3100/api/health
```

The runtime config enables five public live sources. Optional Apify, Adzuna, and Jooble sources activate when credentials are configured. Synthetic demo data is isolated to `config/mcp-servers.test.json` for CI only.

### If Docker is not installed: run the worker natively

You need Node.js 22+ and Redis 7 running locally; the worker uses Redis for its queue. Install Redis using your Linux distribution's package manager, start the Redis service, and confirm `redis-cli ping` returns `PONG`. Keep `REDIS_HOST=127.0.0.1` and `REDIS_PORT=6379` in the worker `.env`.

In terminal 1, start the agent from its repository directory:

```bash
npm ci
npx playwright install chromium
npm run start:dev
```

Do not replace the default `MCP_SERVERS_CONFIG=./config/mcp-servers.json` with the CI-only `config/mcp-servers.test.json`, or searches will return synthetic demo data instead of live listings.

### 2. Start this UI

From this repository:

```bash
git checkout development
test -f .env || cp .env.example .env
```

Set `NVOID_AGENT_API_KEY` in the UI server's `.env` to exactly match the worker's `AGENT_API_KEY`. Keep it server-side; do not add a `NEXT_PUBLIC_` prefix.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

When Next.js and the worker run on the same host, the default `NVOID_AGENT_URL=http://127.0.0.1:3100` works. If the worker is on another server or private container network, set `NVOID_AGENT_URL` to its reachable internal URL and firewall it so only trusted services can access the worker.

The agent repository also provides a real-provider smoke check at `scripts/live-source-smoke.mjs`. To run it, open the agent repository's GitHub Actions, select **Live job source check** on the `development` branch, and run the workflow manually. It uses the production source configuration (not the synthetic fixture) and verifies the five default public sources return live search results. The normal CI workflow remains isolated on synthetic data so it does not poll external providers on every code change.

## Test the integration

1. Open the dashboard and check that the agent is reachable and at least one MCP source is connected.
2. Open **Find jobs**, enter the target role and preferred location, then click **Search jobs**.
3. Review live results with source labels, match scores, and canonical listing URLs.
4. Click **Run agent** to queue only jobs that have a supported application URL; submissions remain disabled.
5. Open **Applications** to see worker queue states and results.

Live search does not mean a job was applied to. Some providers expose only their own listing URL, not an employer application URL. Those records remain searchable and are not queued as applications. A queued task is not proof of a submitted application.

## API connection design

The browser calls only same-origin routes:

- `GET /api/agent/health`
- `POST /api/agent/search`
- `POST /api/agent/run`
- `GET /api/agent/applications`
- `GET /api/agent/applications/:taskId`

Those route handlers proxy the requests server-to-server to the worker's existing API. The agent key is read from `NVOID_AGENT_API_KEY` on the Next.js server and attached as `x-agent-api-key`. The UI never reads or returns the key.

Searches and runs explicitly disable backend synchronization so test data is not written to the Jobkar API. The current candidate profile is a browser-side fixture and resets on page refresh; real account integration requires an authenticated profile API.

## Production checks still required

- Add authentication and per-user authorization before exposing the workspace to real candidate accounts.
- Persist profiles and resumes through authorized backend APIs.
- Configure and verify real job-source connectors in the agent repository.
- Configure backend synchronization only against the actual Jobkar API routes and schemas.
- Keep auto-submission disabled until real connectors and authorized destination workflows have been tested end to end.
- Use HTTPS and a private network/reverse proxy between the UI and agent.

## Checks

```bash
npm run typecheck
npm run build
```

All changes are being made on the `development` branch. Do not deploy the UI until its integration settings and authentication are configured for the intended environment.
