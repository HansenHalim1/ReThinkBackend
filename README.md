# ReThink Backend

Standalone Next.js API for the ReThink website and native Swift app, extracted from ReThinkTest. Deploy this repository as its own Vercel project.

## Run

Requires Node.js 24 or newer (including the TypeScript test runner).

```sh
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env.local`; use `npm.cmd` if PowerShell blocks `npm`. The API runs at http://localhost:3001, alongside the website on port 3000.

Without `GEMINI_API_KEY`, feedback uses the existing curated fallback. Configure the key only in this backend. `GEMINI_MODEL` preserves the original application's model setting; live provider access/model availability must be verified with your Google account.

## Deploy to Vercel

1. Import HansenHalim1/ReThinkBackend as a new Vercel project, with framework preset Next.js and repository root as the root directory. Use the default build/output settings and Node.js 24.x.
2. Set `GEMINI_API_KEY` if AI feedback is wanted, and `GEMINI_MODEL` to the model available to your account.
3. Set `ALLOWED_ORIGINS` to the exact website origins, for example `https://your-website.vercel.app,http://localhost:3000`. Separate origins with commas; omit paths and trailing slashes. Add preview domains explicitly when needed.
4. Deploy and check `https://YOUR-BACKEND.vercel.app/api/health`. Redeploy after changing environment variables.

## API

- `GET /`: service name and endpoint list.
- `GET /api/health`: `{ "aiConfigured": false, "model": "gemini-3.8-flash" }`. `aiConfigured` indicates a key is present, not that a live provider request has succeeded.
- `POST /api/feedback`: accepts `{ "questionId": "...", "answer": "...", "reasoning": "..." }`. Returns `{ "feedback": "...", "source": "curated" | "gemini", "reason"?: "...", "model"?: "..." }`. See `lib/content.ts` for question IDs. No AI help is available on independent retry/transfer items.
- `OPTIONS` on both API endpoints supports browser CORS preflight. Responses are not cached. Disallowed browser origins receive 403. Native clients may omit Origin.

Invalid JSON, unknown questions, missing fields, and unsupported math return 400. Bodies over 4,000 decoded characters return 413. Answer length is limited to 160 characters and reasoning to 1,200. Provider errors and invalid AI output return curated feedback with status 200.

## Connect clients

The website should call `${NEXT_PUBLIC_API_BASE_URL}/api/health` and `${NEXT_PUBLIC_API_BASE_URL}/api/feedback`, with `NEXT_PUBLIC_API_BASE_URL` set to this deployment's origin (no trailing slash). The existing website still calls its own API until that separate migration is made. Never place the Gemini key in the website or Swift app.

Swift can use URLSession with the same JSON request and `Content-Type: application/json`. Do not send a browser Origin header from the native app.

## Scope

This extraction preserves feedback behavior, deterministic checking, the question bank, and learning engine. It does not add accounts, a database, synchronized progress, or learning-session endpoints. The website still owns its browser-local learning state. API contracts for server-owned sessions can be added when those features are implemented.

CORS restricts browser access; it is not authentication. The API currently has no authentication or distributed rate limiting. Configure access/quota protection before broad public use. When Gemini is configured, diagnostic/guided student answers and reasoning are sent to Google.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

Tests cover existing math/learning behavior, feedback guards, CORS/preflight, native requests, invalid API input, and fallback without a key. No live Gemini call is required by the tests.
