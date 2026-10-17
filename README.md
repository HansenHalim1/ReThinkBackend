# ReThink Backend

Standalone Next.js API for the ReThink website and native Swift app, extracted from ReThinkTest. Deploy this repository as its own Vercel project.

## Supabase accounts and database

See [SETUP.md](SETUP.md) for the migration, project settings, environment variables, deployment order and the shared web/Swift API contract. Feedback now requires a verified Supabase access token. Profiles and progress are stored in PostgreSQL with account ownership policies and service-only progress writes.

## Run

Requires Node.js 24 or newer (including the TypeScript test runner).

```sh
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env.local`; use `npm.cmd` if PowerShell blocks `npm`. The API runs at http://localhost:3001, alongside the website on port 3000.

Without `GEMINI_API_KEY`, adaptive probe selection and feedback use curated fallbacks. Configure the key only in this backend. `GEMINI_MODEL` selects the model for provisional hypotheses and probe selection; live provider access/model availability must be verified with your Google account.

## Deploy to Vercel

1. Import HansenHalim1/ReThinkBackend as a new Vercel project, with framework preset Next.js and repository root as the root directory. Use the default build/output settings and Node.js 24.x.
2. Set `GEMINI_API_KEY` if AI feedback is wanted, and `GEMINI_MODEL` to the model available to your account.
3. Set `ALLOWED_ORIGINS` to the exact website origins, for example `https://your-website.vercel.app,http://localhost:3000`. Separate origins with commas; omit paths and trailing slashes. Add preview domains explicitly when needed.
4. Apply the Supabase migration and configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and backend-only `SUPABASE_SECRET_KEY` as described in SETUP.md.
5. Deploy and check `https://YOUR-BACKEND.vercel.app/api/health`. Redeploy after changing environment variables.

## API

- `GET /`: service name and endpoint list.
- `GET /api/health`: `{ "aiConfigured": false, "model": "gemini-3.8-flash" }`. `aiConfigured` indicates a key is present, not that a live provider request has succeeded.
- `GET /api/me`: authenticated account/profile.
- `GET /api/progress` and `POST /api/progress`: authenticated learning state and server-validated commands (see SETUP.md).
- `POST /api/diagnostic`: development-only, local-origin endpoint for adaptive selection in demo mode. It is unavailable outside `NODE_ENV=development`.
- `POST /api/feedback`: requires `Authorization: Bearer <access_token>` and accepts `{ "questionId": "...", "answer": "...", "reasoning": "..." }`. Returns `{ "feedback": "...", "source": "curated" | "gemini", "reason"?: "...", "model"?: "..." }`. See `lib/content.ts` for question IDs. No AI help is available on independent retry/transfer items.
- `OPTIONS` supports browser CORS preflight where needed. Responses are not cached. Disallowed browser origins receive 403. Native clients may omit Origin on authenticated endpoints.

Invalid JSON, unknown questions, missing fields, and unsupported math return 400. Bodies over 4,000 decoded characters return 413. Answer length is limited to 160 characters and reasoning to 1,200. Provider errors and invalid AI output return curated feedback with status 200.

## Connect clients

The website should call `${NEXT_PUBLIC_API_BASE_URL}/api/health` and `${NEXT_PUBLIC_API_BASE_URL}/api/feedback`, with `NEXT_PUBLIC_API_BASE_URL` set to this deployment's origin (no trailing slash). The website now uses this shared API and Supabase Auth. Never place the Gemini key in the website or Swift app.

Swift can use URLSession with the same JSON request and `Content-Type: application/json`. Send the Supabase access token in the Authorization Bearer header. Do not send a browser Origin header from the native app.

## Scope

The backend owns grading and learning transitions and stores per-account progress in Supabase. It includes profiles, attempts inside session snapshots, and revision-based save conflicts. Gemini can suggest a provisional, concept-specific hypothesis and select one unused probe from the curated bank. Deterministic rules decide whether evidence confirms, rejects, or leaves the suspected blocker uncertain.

CORS restricts browser access; it is not authentication. Protected endpoints verify Supabase tokens. Distributed rate limiting is not included. Configure access/quota protection before broad public use. When Gemini is configured, diagnostic answers and reasoning are sent to Google. The unauthenticated demo selector is restricted to development and localhost browser origins; do not expose a development server to untrusted networks.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

Tests cover math/learning behavior, authenticated HTTP flows, cross-account isolation, concurrent saves, and the actual migration/RLS policies in embedded PostgreSQL. No live Gemini call is required by the tests.
