# Nvoid Web View

A Next.js user interface for the Nvoid AI Agent worker. This repository contains the user-facing workspace only; the job discovery, matching, queue, and browser automation engine live in [nvoid_ai_agent](https://github.com/jobkar-official/nvoid_ai_agent).

## Included

- Candidate profile form with clearly fictional default test details.
- Live job search through enabled agent sources; the default worker source is Jobicy’s public remote-jobs feed.
- Source attribution and canonical listing links, with role and supported geographic-region filtering.
- Synthetic demo data isolated from the default runtime configuration and used only by CI.
- Profile match scores and job cards.
- Agent run controls and application task history.
- Worker connection and MCP source status.
- Server-side Next.js API proxy to the agent, keeping the agent API key out of browser JavaScript.
- Review-only execution: every run sends `autoSubmit: false` and `syncToBackend: false`.

The candidate profile shown initially is fictional and stored only in browser state; it is not saved to a user database. Job search results are live provider data, not generated demo listings. The current public connector covers remote jobs and links to Jobicy listing pages; it does not provide a verified employer application URL, so those results are not queued for automated application. Naukri and LinkedIn remain disabled until real authorized connectors are configured. Keep all application execution in review-only mode while testing.

## Run locally

Use Node.js 22 or newer. Start the agent worker separately first. The documented development setup for the worker is in its own repository.

### 1. Start the agent worker

Clone and run the development branch of the agent project, configure a private `AGENT_API_KEY`, leave auto-submit disabled, and start its Docker services:

```bash
git clone https://github.com/jobkar-official/nvoid_ai_agent.git
cd nvoid_ai_agent
git checkout development
cp .env.example .env
```

Edit `.env` to set a strong random `AGENT_API_KEY` and keep `AUTO_SUBMIT_ENABLED=false`, then:

```bash
docker compose up --build -d
curl http://127.0.0.1:3100/api/health
```

The demo MCP source is enabled on the agent's development branch and returns synthetic data only.

### 2. Start this UI

From this repository:

```bash
git checkout development
cp .env.example .env
```

Set `NVOID_AGENT_API_KEY` in the UI server's `.env` to exactly match the worker's `AGENT_API_KEY`. Keep it server-side; do not add a `NEXT_PUBLIC_` prefix.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

When Next.js and the worker run on the same host, the default `NVOID_AGENT_URL=http://127.0.0.1:3100` works. If the worker is on another server or private container network, set `NVOID_AGENT_URL` to its reachable internal URL and firewall it so only trusted services can access the worker.

## Test the integration

1. Open the dashboard and check that the agent is reachable and at least one MCP source is connected.
2. Keep **Demo source** selected.
3. Open **Find jobs**, then click **Search jobs**.
4. Review the returned synthetic job cards and match scores.
5. Click **Run agent** or **Run & queue** to enqueue a limited batch in review-only mode.
6. Open **Applications** and refresh the task list to see worker queue states and results.

Demo application links point to `example.com`, where no application form is available. A `NEEDS_USER_ACTION` result is therefore expected for those demo jobs. It is not a successful application.

## API connection design

The browser calls only same-origin routes:

- `GET /api/agent/health`
- `POST /api/agent/search`
- `POST /api/agent/run`
- `GET /api/agent/applications`
- `GET /api/agent/applications/:taskId`

Those route handlers proxy the requests server-to-server to the worker's existing API. The agent key is read from `NVOID_AGENT_API_KEY` on the Next.js server and attached as `x-agent-api-key`. The UI never reads or returns the key.

For the demo, searches and runs explicitly disable backend synchronization to prevent synthetic records being written to the Jobkar API. Candidate profile edits reset on page refresh; production should replace this fixture with your authenticated profile API.

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
