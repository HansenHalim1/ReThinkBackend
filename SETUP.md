# Supabase setup and client contract

Target project: https://supabase.com/dashboard/project/hhovzaaeolcfynyetabf

## Activate the database

Apply migrations in filename order using Supabase migrations or the SQL Editor. It creates:

- `profiles`: one display name per Auth user, including a signup trigger and backfill for existing users.
- `learning_progress`: a validated learning-session snapshot and revision per user/concept. Attempts are retained inside each session JSON, matching the existing engine's 100-attempt cap.
- Users may update only their own display name. Progress rows are readable only by the backend service role; browser and Swift clients must use the authenticated backend API.
- Service-role-only progress reads/writes and a `save_learning_progress` function with atomic revision checks. Browser/Swift clients cannot directly read progress, write progress, or claim mastery.

The second migration removes direct client reads without changing stored progress. Deploy the backend version that reads with the service role before applying it; older backend deployments will no longer be able to load progress. Rollback requires restoring `SELECT` plus the `progress_read_own` policy, which makes each user's full assessment JSON readable from that user's Supabase client again. Database rows cascade when the corresponding Auth user is deleted.

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

Keep Gemini settings in the backend. After each diagnostic answer, Gemini updates a private provisional hypothesis and selects the next unused foundation probe from the bank, for at most three probes. Deterministic backend rules still decide the final diagnosis. Deploy the backend first, apply `202610170002_private_learning_progress.sql`, then deploy the website. `/api/feedback` and progress still require sign-in. This work does not automatically push, migrate, or deploy either repository.

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

Other actions: `advance`, `reinforce`, `reset` (omit answer/reasoning). Start with expectedRevision 0 when no row exists. Always use the latest returned revision. Backend verification determines the owner; do not send a user ID. Grading and state transitions are calculated on the server; client-supplied mastery or session fields are ignored. Progress API responses omit diagnosis, hypothesis, mastery, and error-pattern fields.

401 means the token is missing/invalid/expired; refresh the Supabase session and retry once. 400 means invalid input or transition. 409 means a concurrent update: fetch latest progress and let the user review before another command. 503 means Auth/database configuration or connectivity is unavailable. No mutation is optimistically shown as saved in the frontend before the backend confirms it.

The same authenticated Supabase user ID gives web and Swift the same progress. Each device manages its own session. On web sign-out, the workspace is unmounted; logging into a different account starts with that account's server state. Existing anonymous `rethink-mvp-v1` localStorage records remain untouched and are not silently assigned to a newly signed-in user. There is no guest-data import or general math-ability assessment. AI hypotheses remain provisional and concept-specific.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Tests include actual migration/RLS/trigger/cascade/revision behavior in embedded PostgreSQL (PGlite) and mocked Supabase HTTP integration for token rejection, user isolation, forged-state rejection and concurrency. These tests do not apply the migration or create accounts in the live project.

## SMA curriculum (kelas 10–12)

Apply `supabase/migrations/202610180001_sma_curriculum.sql` after the first two migrations. Paste the entire file into the Supabase SQL Editor and run it once. It adds a private `curriculum_progress` table plus service-role-only `save_curriculum_progress` RPC. Existing profiles and pretest sessions are untouched. The migration must be applied before enabling the new frontend's signed-in SMA progress. No additional environment variables are required.

Deploy the backend before the frontend. The new `/api/curriculum` endpoint is additive; older clients keep using the existing APIs. This repository prepares the migration but does not apply it to the live Supabase project.

Both website and Swift clients use the same Supabase Bearer access token:

- `GET /api/curriculum` returns `{ unlocked, modules, progress }`. Modules contain the shared kelas 10–12 catalogue, explanations, formulas, examples, and quiz options. Answer keys and quiz explanations are omitted until submission. Progress contains `{ moduleId, completed, attempts, revision }` for the authenticated account only.
- `POST /api/curriculum` accepts `{ moduleId, answerId, expectedRevision }`. Start with revision `0`. It returns `{ correct, explanation, progress }` after saving. Completion is retained once a correct answer has been recorded. Server grading ignores client-supplied completion, correctness, owner IDs, or session snapshots.
- `403` means both foundation sessions have not reached `complete`; diagnosis/mastery do not affect this gate. `409` means a stale revision: fetch progress again before retrying. `503` can mean the new migration is missing.

The RPC checks and locks both pretest rows in the same transaction as the save. Browser and Swift credentials cannot access this table or invoke its write function directly. Deleting an Auth account cascades to its curriculum progress. The material IDs and questions in `lib/curriculum.ts` must match the frontend copy; adding IDs also requires a constraint migration.

The roadmap contains 18 introductory lessons and one checkpoint per material. These completion flags do not claim validated mastery. The grade ordering is ReThink's learning sequence; schools may distribute Fase F topics differently.
