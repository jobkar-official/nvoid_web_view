# Nvoid Web View

Next.js frontend for the Nvoid Engine. The `testing` branch connects the job-search interface to the `nvoid-engine` branch of [nvoid_ai_agent](https://github.com/jobkar-official/nvoid_ai_agent).

## Job search integration

- Search from the frontend by job title and city, country or remote location.
- Results come from Nvoid Engine's own SQLite index of public company career pages.
- Original job listing and application URLs are retained.
- City aliases and nearby-city matching are handled by the engine.
- Search is read-only. It does not submit applications or synchronize test data to Jobkar.
- The agent API key stays on the Next.js server and is never exposed to browser JavaScript.

**Important:** Search reads the engine's existing index. It does not crawl the internet on every search request. Add companies and run the first crawl before expecting results. The engine refreshes its configured company index in the background every 12 hours.

## Run locally

Use Node.js 22.13 or newer. Run the agent and web app in separate terminals on the same machine.

### 1. Start nvoid-engine

```bash
git clone https://github.com/jobkar-official/nvoid_ai_agent.git
cd nvoid_ai_agent
git fetch origin
git checkout nvoid-engine
npm ci
cp .env.example .env
```

Edit the agent `.env` and set a private key:

```env
PORT=3100
API_KEY=replace-with-a-long-random-secret
DB_PATH=data/nvoid.db
CRAWL_INTERVAL_HOURS=12
RESPECT_ROBOTS=true
```

Seed companies and build the first index:

```bash
npm run seed -- seeds/companies.txt "Delhi"
npm run crawl -- --force
npm run stats
```

The seed command probes supported public ATS boards (Greenhouse, Lever, Ashby, SmartRecruiters and Recruitee). Companies not detected on those boards must be added with their public careers URL:

```bash
npm run add-company -- "Company Name" "https://company.example/careers"
npm run crawl -- --force
```

Start the worker:

```bash
npm run dev
```

Verify it:

```bash
curl http://127.0.0.1:3100/health
curl -H "x-api-key: YOUR_API_KEY" "http://127.0.0.1:3100/search?title=java%20developer&city=Noida&page=1&limit=100"
```

### 2. Start the testing web branch

In a second terminal:

```bash
git clone https://github.com/jobkar-official/nvoid_web_view.git
cd nvoid_web_view
git fetch origin
git checkout testing
npm ci
cp .env.example .env
```

Set the following values in the web app's `.env`. The key must exactly match the agent's `API_KEY`:

```env
NVOID_AGENT_URL=http://127.0.0.1:3100
NVOID_AGENT_API_KEY=the-same-value-as-agent-API_KEY
```

Then start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000/job-search](http://localhost:3000/job-search), enter a job title and location, and select **Search jobs**. For example:

```
Job title: Java Developer
Location: Noida
```

The guest search page also supports a query URL such as `/job-search?role=java+developer&location=noida`.

### 3. Frontend-to-agent request flow

The browser calls the same-origin Next.js route. The Next.js server attaches the private API key and translates the UI profile into the engine's search query.

| Frontend route | Agent endpoint | Purpose |
|---|---|---|
| `GET /api/agent/health` | `GET /health` | Worker health and index stats |
| `POST /api/agent/crawl` | `GET /search` | Search indexed jobs by title and location |
| `POST /api/agent/search` | `GET /search` | Search alias used by the UI |

The agent authenticates private endpoints with `x-api-key`. The health endpoint is public. The web proxy uses `NVOID_AGENT_API_KEY` server-side.

### 4. What to expect

- If the index contains matching jobs, the frontend displays real records with company, title, location, description, salary when published, source, match score, and original URLs.
- If the index is empty, the frontend correctly shows zero results. Seed companies and run the first crawl; do not replace this with synthetic listings.
- Search is fast because it queries SQLite full-text search. The crawl happens separately and respects the configured robots policy and host delay.
- The current engine does not scrape login-protected LinkedIn, Naukri, Indeed or Apna pages. Coverage depends on the companies added to its index and their public career pages.
- A missing salary, experience range, notice period or posting date is not invented; those fields remain unavailable when the source does not publish them.
- A job's presence in the index is not proof that the employer is still accepting applications. Open the original listing to verify.

## Checks

From the web repository:

```bash
npm run typecheck
npm run build
```

From the agent repository:

```bash
npm run typecheck
npm test
npm run build
```

Keep these changes on the `testing` web branch and `nvoid-engine` agent branch. Do not merge into `main` as part of this integration.
## Public site, guest search, and role-based workspace

The public route group provides:

- `/` — guest job discovery using the existing `POST /api/agent/search` proxy. Guests can search without signing in.
- `/release`, `/models` (also `/model`), `/about`, `/privacy`, `/terms`, `/security`, `/cookies`, and `/free-job-posting`.
- `/auth/signin`, `/auth/register`, and `/auth/forgot-password`.
- `/workspace` and role-aware workspace sections for role ID 3 (recruiter), 4 (job seeker), and 7 (support).
- Development-only visual previews at `/preview/workspace/3`, `/preview/workspace/4`, and `/preview/workspace/7`. These routes return 404 in production.

Guest search history is stored in the current browser's local storage under `nvoid.guest-search-history.v1`. Each entry has a UUID, job title, location, search timestamp and returned result count. A guest can restore a prior query, delete one item, or clear the history. Guest search history is not synced between devices.

### Authentication service adapter

The web app uses same-origin Next.js routes for session management and rewrites the `/authController/*` service paths to the authentication microservice. The browser posts credentials to `POST /authController/login`; after success it posts the returned DTO to `POST /api/auth/session` to establish HttpOnly cookies. Logout and session inspection remain local routes.

The browser calls same-origin `/authController/login` and `/authController/sendCodeForgotPassword` paths. Next.js rewrites these requests server-side to the authentication service under `https://edge.jobkar.in/authentication/authController/*`; the production host is not called directly by browser JavaScript. After successful login, the browser posts the returned auth DTO to same-origin `POST /api/auth/session`, which stores the access and refresh tokens in HttpOnly cookies.

- `NVOID_API_BASE_URL=https://edge.jobkar.in`
- `NEXT_PUBLIC_API_URL=https://edge.jobkar.in`
- `NEXT_PUBLIC_SOCKET_URL=https://chat.jobkar.in`

Password login sends only the email and password fields required by the authentication service's AuthVO. The selected account type is checked against the roleId returned by the backend; login does not override the account role.

After direct browser sign-in, the browser posts the returned auth DTO to the same-origin session route, which stores the access token, refresh token and minimal account context in HttpOnly, SameSite=Lax cookies. The token is not written to local storage. The private route group checks the cookie session before rendering. If an API returns 401, the server proxy refreshes the access token through the configured authentication service route, rotates the access/refresh cookies when refresh succeeds and retries the original request. An unsuccessful refresh clears the session cookies.

All browser API calls use same-origin `/api/jobkar/*` routes. The proxy attaches the bearer token server-side and forwards requests to the configured Edge Gateway or Jobkar Chat service. This avoids browser CORS dependencies and keeps access/refresh tokens out of client code. Keep the API and auth base URLs server-controlled; do not place private service credentials in `NEXT_PUBLIC_*` variables.

Forgot-password calls the authentication service's `POST /authController/sendCodeForgotPassword?email=...` endpoint through the same-origin Next.js rewrite. This web view does not create a separate identity database.

### Private workspace and Jobkar API integration

The authenticated workspace is available at `/workspace` and its sections are served from the private route group. It redirects unauthenticated visitors to `/auth/signin?next=/workspace` and is marked `noindex,nofollow`.

The private workspace uses the API modules in `lib/api` and the shared request client in `lib/context/client.ts`. Connected account operations include:

- Profile lookup and updates through `usersApi`.
- Skill, qualification and experience read/create/update/delete operations.
- Resume listing, upload and deletion.
- Recommended and saved jobs, including save/remove actions.
- Open-to-work preferences and availability status.
- Notifications, mark-as-read and delete actions.
- Support ticket listing, creation and closure.
- Chat thread listing and conversation history.

The **API connections** section runs live read checks using the signed-in account session and distinguishes an empty successful response from a failed request. **Find jobs** uses the Nvoid agent's live source search and keeps `syncToBackend=false`; it does not submit applications.

The current API modules do not define a personal application-history endpoint, a verified job-create/applicant-management contract, or a send-message operation. Those actions are explicitly identified as unavailable instead of showing fabricated records or claiming that an operation succeeded. Backend authorization must still be enforced by the Jobkar APIs for every read and mutation; hiding a UI control is not authorization.

The role-aware private navigation supports account roles 3 (recruiter), 4 (job seeker) and 7 (support). The workspace is private and is not included in public indexing.

Guest job search is publicly reachable and should be protected with server-side rate limiting, abuse monitoring and provider-cost controls before a public launch. Policy pages are implementation drafts; insert the operator's legal identity, contact details, retention periods and final reviewed legal wording before treating them as binding policies.
