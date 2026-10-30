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
- General-purpose research workspace backed by real connected read-only MCP tools, public-web search, schema-aware tool planning, parallel execution, source diagnostics, deduplicated records and original result URLs.
- Server-side Next.js API proxy to the agent, keeping the agent API key out of browser JavaScript.
- Review-only execution: every run sends `autoSubmit: false` and `syncToBackend: false`.

The candidate profile shown initially is fictional and stored only in browser state; it is not saved to a user database. Job search results are provider data, not generated demo listings. The five default public feeds are checked against the chosen role and country/location eligibility before results reach the UI. Provider data is cached for 5–60 minutes depending on source, so the feed is current but not second-by-second streaming. Optional Naukri, LinkedIn, Indeed, Glassdoor, and Apna connectors activate when a private `APIFY_API_TOKEN` is configured in the agent's `.env`; Adzuna and Jooble activate when their own credentials are present. Third-party actors can charge per result plus platform usage. Public-board listings are not queued for automatic application unless a direct external application URL is provided. Keep submission in review-only mode.

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

## General-purpose live research

The **Research anything** workspace is separate from candidate job search. It can execute read-only tools exposed by any connected MCP server, not only job/job-board connectors.

1. Merge and deploy the backend federated research change from [nvoid_ai_agent PR #1](https://github.com/jobkar-official/nvoid_ai_agent/pull/1).
2. Configure `SERPER_API_KEY` in the agent worker's server-side `.env` to enable Google-indexed public-web research and bounded public-page crawling.
3. Configure each third-party MCP endpoint and its authorized credentials in the worker's `config/mcp-servers.json` / `.env`. A ChatGPT or Claude host connection is not automatically available to a separately deployed Nvoid process.
4. Open **Research anything**, load the connected tool catalogue, enter a research question, select read-only sources and run the query.
5. Inspect the report's configured/connected source coverage, actual tool calls, execution errors, returned record counts, deduplicated records and source URLs.

The research route is read-only. It never invokes tools identified as mutating/destructive. The UI displays actual tool results; it does not fill missing results with sample records. Result quantity depends on the providers, permissions, credentials, search budget and accessible public pages. LLM-based tool planning and dork expansion require the backend's `LLM_API_KEY` and `LLM_MODEL`; without them, the worker uses its bounded schema-based fallback.

## Test the integration

1. Open the dashboard and check that the agent is reachable and at least one MCP source is connected.
2. Open **Connections** to inspect every configured MCP connector, its live status, and the tools/skills returned by connected servers. Inactive sources show their configuration requirements; enabled sources that fail to connect show their worker error.
3. Open **Find jobs**, enter a job title and location, then click **Search jobs**. Nvoid automatically runs every connected source with a compatible job-search tool; no source checkboxes are required.
4. Review the paginated two-column job cards. Each listing shows company, location, posting date, experience, employment type, salary, provider/source, description and any requirements the provider returned. Expand full details to inspect extra fields, and use the original listing or employer application link.
5. Click **Run agent** from the dashboard when you are ready to queue eligible jobs for review; submissions remain disabled.
6. Open **Applications** to see worker queue states and results.
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
