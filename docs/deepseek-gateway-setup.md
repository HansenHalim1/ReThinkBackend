# DeepSeek through Vercel AI Gateway

All AI generation uses `lib/ai.ts` in the backend: adaptive diagnostic selection, guarded learning feedback, and transcript explanations. The default model is `deepseek/deepseek-v4.1-flash-1017`. Web and Swift call the existing ReThink endpoints with Supabase access tokens. They never receive a Gateway credential.

## Activate

1. In the backend Vercel project, set `AI_GATEWAY_API_KEY` to a Gateway key from the intended Vercel team. For local development, put it in the backend's untracked `.env.local`. A runtime-provided `VERCEL_OIDC_TOKEN` is supported when no explicit key is configured.
2. Set `AI_GATEWAY_MODEL=deepseek/deepseek-v4.1-flash-1017`. Only `deepseek/…` identifiers are accepted. Remove obsolete `GEMINI_API_KEY` and `GEMINI_MODEL` from deployment settings; the application ignores them.
3. Check that the model is eligible for your team's free-tier credit in the [current free-tier model list](https://vercel.com/ai-gateway/models?freeTier=true) and Gateway dashboard. Then redeploy/restart the backend.
4. `GET /api/health` reports `provider: vercel`, `model`, and `aiConfigured`. This checks configuration only. Make one authenticated feedback or transcript request to verify access. A successful validated model response has `source: gateway`; otherwise inspect its curated fallback `reason`.

## Credits and failure behavior

Vercel documents $5 monthly credit for the Free Tier, limited to eligible models and lower request limits. Purchasing credits transitions the team to the paid tier and ends the recurring free allocation. Availability and balance must be checked for the actual team; the app cannot guarantee free use. See [official pricing](https://vercel.com/docs/ai-gateway/pricing) and the [model page](https://vercel.com/ai-gateway/models/deepseek-v4.1-flash-1017).

The app makes one Gateway request per AI operation, caps output tokens, and disables reasoning output. It has no application retry, alternate-model routing, Gemini fallback, or automatic credit purchase. This is not a hard spending cap: the Gateway account's billing configuration controls whether paid credits can be used. Missing credentials, 402 credit exhaustion, 403 access denial, provider failures, and invalid output return labeled curated content. Authentication and deterministic grading remain enforced. Diagnosis selects only existing bank questions.

Requests use the [Gateway chat-completions API](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions) with structured JSON. Diagnostic answers/reasoning, learning feedback context, and selected transcript passages/questions are sent through Gateway to its providers. Keys, Supabase tokens, and other students' records are excluded from model context.

## Verification

Automated tests mock Gateway success, malformed output, refusal, truncation, missing/invalid credentials, 402/403/429, OIDC, and legacy Gemini settings. They verify guarded feedback and passage grounding. No Gateway credential was available during implementation, so live DeepSeek access, free-tier eligibility, and billing have not been verified. Swift examples require an Xcode build by the iOS team.

The migration passed 17 frontend tests, 20 backend tests, and production builds for both repositories. Chromium checks passed for desktop/mobile transcript selection, DeepSeek versus curated labels, authenticated request payloads, retry drafts, and stale-response handling. The rebuilt local backend returned HTTP 200 from `/api/health` with `provider: vercel`, the default DeepSeek model, and `aiConfigured: false`, correctly reflecting the missing Gateway credential.
