# Unified foundation pretest

The main app at http://localhost:3000 has one **Pretest dasar** entry. Students no longer choose between distribution and inverse-operation tests. Each question displays its topic name. The pilot covers eight foundation topics with 24 original multiple-choice questions from the starter bank: integers/order of operations, fractions, ratios, percentages, distributive algebra, linear equations, coordinates/slopes, and Pythagoras/roots.

Every student gets three rounds: eight entry questions, eight routine questions, then eight applications. There is no time limit. “Belum tahu” records an unknown answer and advances. Answers are graded on the backend; the client receives only the current prompt/options, never keys or distractor diagnoses. The test does not teach or reveal correctness between questions.

This release implements topic coverage and a single increasing-difficulty test. The question order is deterministic. AI-selected targeted follow-ups, additional SMA/advanced topics, calibrated difficulty, and automatic lesson recommendations remain future work. DeepSeek continues to power existing feedback/transcript services; it is not called by this pretest.

## Results and checklist

After all 24 answers, the backend returns eight topic summaries. At least two correct answers out of three suggests an initially checked topic. This is a transparent pilot rule, not an AI judgment or validated mastery score. Students can check/uncheck every topic and explicitly save their self-assessment. Their choices are stored separately from answers and never change grading or curriculum access. No claim of measured diagnostic accuracy is made.

The pilot subset has been checked for arithmetic/algebra correctness, unique choices, answer references, complete topic coverage, and increasing round order. The full 126-question authoring bank remains draft. Teacher review, broader skill coverage per topic, and student-based difficulty calibration are still needed before using the results for consequential placement.

## Web and Swift API

All authenticated requests use `Authorization: Bearer <Supabase access_token>` for the existing project. No user ID or complete session snapshot is accepted from the signed-in client.

- `GET /api/assessment`: load/resume the current versioned test. A new account gets revision 0 and `status: not-started`.
- `POST /api/assessment`: submit `{ "action": "answer", "questionId": "f-integers-01", "optionId": "a", "expectedRevision": 0 }`. Use `optionId: "__unsure"` for “Belum tahu”. Only the current question can be answered. Successful responses advance the question and revision once.
- `POST /api/assessment`: after completion, save `{ "action": "review", "knownTopicIds": ["f-integers"], "expectedRevision": 24 }`. An empty array intentionally unchecks everything. Omitted topics are unchecked.

Responses contain `schemaVersion`, `bankVersion`, `revision`, `status` (`not-started`, `in-progress`, `complete`), `answered`, `total`, `topicCount`, `checklistSaved`, `question`, and `topics`. A question contains `id`, `topicId`, `topicTitle`, `difficulty` (1–3), `prompt`, and `options` (`id`, `text`). Before completion, `topics` is empty. At completion, `question` is null and topic results contain `id`, `title`, `correct`, `total`, `suggestedKnown`, and `checked`.

401 means refresh sign-in; 400 means invalid command; 409 means stale revision or unsupported bank version; 413 means excessive body; 503 means unavailable Auth/database or missing migration. On a revision conflict fetch again, show the current question, and let the student decide before resubmitting. Never retry a saved answer automatically after a timeout. Show checklist save success only after the server confirms it.

Anonymous demo uses `GET/POST /api/assessment-demo` with the same question/result projection and an additional `demoSession` field. POST sends the latest `demoSession` plus `action`, `questionId`/`optionId`, or `knownTopicIds`. This endpoint revalidates the sequence, performs no database/provider calls, and cannot unlock any real account. Its client-held session is intentionally practice-only; reload starts over. Signed-in clients must never use it for saved progress.

The backend Swift example includes assessment load, answer and checklist methods. See [the OpenAPI contract](assessment-api.openapi.json).

## Deployment

1. Apply backend `supabase/migrations/202610210001_foundation_assessment.sql` after the three existing migrations. The new table/RPC are service-role-only, with account ownership derived from the verified token, atomic revision checks, and account-deletion cascade. The migration also updates the curriculum RPC to accept the new completed test or both legacy foundation sessions.
2. Deploy the backend, then the frontend. Existing completed legacy pretests and saved SMA progress remain valid. Completion of the new test unlocks curriculum regardless of score or checklist choices. No new environment variable is needed.
3. Confirm the authenticated endpoint can save/resume with a real account before inviting users. The anonymous demo works without this migration.

The migration is prepared and tested in embedded PostgreSQL; it has not been applied to the live Supabase project by this change. Swift code has not been compiled in Xcode.

## Verification results

All 18 frontend tests and 24 backend tests passed, including actual migration/RLS/revision checks in embedded PostgreSQL. Both production builds passed. The real anonymous browser demo completed all 24 questions and checked three difficulty rounds, per-question topic labels, navigation/resume, skip answers, separately saved checklist edits, curriculum unlocking, mobile layout, and reset after reload. A second browser run used synthetic authenticated transport to verify failed-save draft retention, account resume, 409 recovery, failed-read blocking/retry, and saved-checklist reload. This does not verify live Supabase migration deployment. The existing video/transcript Chromium suites also passed against ports 3000/3001, including real playback, captions, seeking, derivative interaction, and authenticated AI-help UI.

The pilot bank is frozen by `bankVersion`; changing its question order/count, grading, or content requires an explicit version/migration plan. Current SQL completion and bank constraints are for the 24-question v1 only. Do not overwrite an in-progress bank in place.

Screenshots: [desktop test](pretest-desktop.png) · [mobile results](pretest-results-mobile.png).
