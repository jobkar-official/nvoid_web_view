# Nvoid Web View

A Next.js user interface for the Nvoid AI Agent worker. This repository contains the user-facing workspace only; the job discovery, matching, queue, and browser automation engine live in [nvoid_ai_agent](https://github.com/jobkar-official/nvoid_ai_agent).

## Included

- Candidate profile form with clearly fictional default test details.
- Live remote-job discovery from Jobicy and Remote OK, with target-role and supported geographic filtering, provider attribution, canonical listing URLs, and publication dates where available.
- Synthetic demo data isolated from the default runtime configuration and used only by CI.
- Profile match scores and job cards.
- Agent run controls and application task history.
- Worker connection and MCP source status.
- Server-side Next.js API proxy to the agent, keeping the agent API key out of browser JavaScript.
- Review-only execution: every run sends `autoSubmit: false` and `syncToBackend: false`.

The candidate profile shown initially is fictional and stored only in browser state; it is not saved to a user database. Job search results are live provider data, not generated demo listings. Current connectors cover remote roles from Jobicy and Remote OK and preserve original provider listing links. Provider responses are cached for up to one hour to respect their usage guidance; this is fresh source data, not second-by-second streaming. Jobicy public results cover recently published remote jobs, and Remote OK's feed may not give an explicit location-eligibility field for every listing, so check the listing when it says eligibility is unspecified. Jobicy listings are listing-only; Remote OK listings are queue-eligible only when the feed provides a verified external application URL. Naukri and LinkedIn remain disabled until real authorized connectors are configured. Keep execution in review-only mode while testing.

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

The runtime config enables live Jobicy and Remote OK sources. Synthetic demo data is isolated to `config/mcp-servers.test.json` for CI only.

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

The agent repository also provides a real-provider smoke check at `scripts/live-source-smoke.mjs`. Its GitHub Actions workflow runs against the production source configuration (not the synthetic fixture) and verifies both providers return live search results. The deterministic CI workflow remains isolated on synthetic data so it does not poll external providers on every code change.

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
