# Supabase setup and client contract

Target project: https://supabase.com/dashboard/project/hhovzaaeolcfynyetabf

## Activate the database

Apply `supabase/migrations/202610170001_accounts_and_progress.sql` to this project using Supabase migrations or the SQL Editor. It creates:

- `profiles`: one display name per Auth user, including a signup trigger and backfill for existing users.
- `learning_progress`: a validated learning-session snapshot and revision per user/concept. Attempts are retained inside each session JSON, matching the existing engine's 100-attempt cap.
- Own-account read policies; users may update only their own display name. Anonymous clients have no table access.
- A service-role-only `save_learning_progress` function with atomic revision checks. Browser/Swift clients cannot directly write progress or claim mastery.

The migration is additive and intended to be applied once via migration tracking. It does not modify Auth configuration or existing application tables. Database rows cascade when the corresponding Auth user is deleted.

## Configure Authentication

Enable Email/password authentication. Keep email confirmation enabled if desired. Set the password minimum to at least 8 characters to match the UI (stronger project policies still apply).

Set the Site URL to `https://re-think-test.vercel.app`. Allow these exact redirect URLs:

- `https://re-think-test.vercel.app/`
- `https://re-think-test.vercel.app/?auth=recovery`
- `http://localhost:3000/`
- `http://localhost:3000/?auth=recovery`

Add preview origins explicitly when needed. Configure production email delivery in Supabase before inviting users broadly. No Google/Apple provider is configured by this implementation.

## Environment variables

Frontend (public, embedded at build time):

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://rethinkbackend.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://hhovzaaeolcfynyetabf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
```

Backend only:

```dotenv
SUPABASE_URL=https://hhovzaaeolcfynyetabf.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
SUPABASE_SECRET_KEY=your-project-secret-key
ALLOWED_ORIGINS=https://re-think-test.vercel.app,http://localhost:3000
```

The backend also accepts legacy `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` equivalents. Never expose the secret/service-role key in the web bundle, Swift binary, logs, or Git. Add keys in each Vercel project's environment settings and local ignored environment files. The dashboard link alone is not a credential.

Keep Gemini settings in the backend. Gemini now proposes a provisional hypothesis and selects an unused curated probe; deterministic backend rules still decide the diagnosis. Deploy the migration, configure keys/redirects, then publish both applications as a coordinated release. `/api/feedback` and progress still require sign-in. This work does not automatically push or deploy either repository.

## API used by both web and Swift

Sign in through Supabase Auth using its client SDK. The website uses email/password, signup confirmation, password reset and password update. The static frontend uses browser-managed Supabase sessions; no frontend server or cookies shared with the API are required.

Send the Supabase access token with `Authorization: Bearer <access_token>` to:

- `GET /api/me` → `{ id, email, displayName, createdAt }`.
- `GET /api/progress` → `{ version: 1, sessions: { ... }, revisions: { distribution?: number, inverse?: number } }`.
- `POST /api/progress` → command below; returns `{ user_id, concept, session, revision, updated_at }`.
- `POST /api/feedback` → existing feedback request/response, now authenticated.

`GET /api/health` remains public and reports configuration flags, not proof of provider/database connectivity. Browser preflights allow Content-Type and Authorization. Swift does not send a browser Origin header. `POST /api/diagnostic` only supports local demo mode during development; it is disabled in production and does not save progress.

```json
{
  "concept": "distribution",
  "action": "submit",
  "expectedRevision": 0,
  "answer": "3x+2",
  "reasoning": "My explanation"
}
```

Other actions: `advance`, `reinforce`, `reset` (omit answer/reasoning). Start with expectedRevision 0 when no row exists. Always use the latest returned revision. Backend verification determines the owner; do not send a user ID. Grading and state transitions are calculated on the server; client-supplied mastery or session fields are ignored.

401 means the token is missing/invalid/expired; refresh the Supabase session and retry once. 400 means invalid input or transition. 409 means a concurrent update: fetch latest progress and let the user review before another command. 503 means Auth/database configuration or connectivity is unavailable. No mutation is optimistically shown as saved in the frontend before the backend confirms it.

The same authenticated Supabase user ID gives web and Swift the same progress. Each device manages its own session. On web sign-out, the workspace is unmounted; logging into a different account starts with that account's server state. Existing anonymous `rethink-mvp-v1` localStorage records remain untouched and are not silently assigned to a newly signed-in user. There is no guest-data import or general math-ability assessment. AI hypotheses remain provisional and concept-specific.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Tests include actual migration/RLS/trigger/cascade/revision behavior in embedded PostgreSQL (PGlite) and mocked Supabase HTTP integration for token rejection, user isolation, forged-state rejection and concurrency. These tests do not apply the migration or create accounts in the live project.
