> Current coverage: all 39 topics have video and visualization assets. The original pilot walkthrough below still works; see [the complete media handoff](complete-concept-media.md) for the new library and native SVG API.

# ReThink video demo and Swift backend handoff

This change adds three real Manim pilot videos: distribution (26s), quadratic transformations (27s), and the secant-to-tangent idea of derivatives (29s). All are silent H.264 MP4 animations at 960×540, 24fps, with Indonesian text, WebVTT captions and JSON transcripts. There is no narration or watch-progress tracking in this release.

## Run the demo

The demo is part of the main app at http://localhost:3000, using the local backend at http://localhost:3001. The earlier ports 3400/3402 were temporary verification servers.

In two terminals, from each repository:

```powershell
# Backend: ../rethinkbackend
npm.cmd run dev

# Frontend: ReThinkTest
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 in .env.development.local, then:
npm.cmd run dev
```

1. Open http://localhost:3000. Choose **Coba tanpa akun (demo)**.
2. Open **Jelajahi Konsep → Sifat distributif → Video**. The public catalog loads from the backend, so this walkthrough requires no Supabase credentials. If the service is unavailable, demo mode offers **Putar video contoh**, an explicit packaged preview. Play, pause, seek, open the transcript and jump to a cue.
3. Repeat for **Persamaan dan fungsi kuadrat** and **Tingkat lanjut → Turunan dan garis singgung**. Switch to **Visualisasi** on the derivative topic and reduce h to see the secant slope approach 2.
4. To show the shared backend itself, open http://localhost:3001/api/videos?topicId=distribution. Load the returned `videoUrl` directly, or use the Swift example. The API returns the same catalog and media as the local preview.
5. The demo and signed-in Video tabs both fetch the shared backend. Stop the backend and use Retry to demonstrate failure handling; demo mode additionally offers an explicit local preview. There is no silent fallback. An existing general topic without a video returns an empty list.

For an iOS simulator/physical device, use a reachable HTTPS backend. `localhost` on a physical phone refers to the phone. Local HTTP development may need narrowly scoped ATS configuration; do not disable ATS for production. Web browser origins must be listed in backend `ALLOWED_ORIGINS`; native URLSession calls omit Origin.

## Public video API

`GET /api/videos` returns all three pilots. `GET /api/videos?topicId=distribution` returns one topic. Other pilot IDs: `x-quadratic`, `advanced-derivatives`.

```sh
curl 'http://localhost:3001/api/videos?topicId=distribution'
```

The response has `schemaVersion: 1`, a `catalogVersion`, and `videos`. Each record includes ID/version/topic/skill IDs, title/summary, language, duration, dimensions, renderer, `hasAudio`, `mimeType`, absolute `videoUrl`, `posterUrl`, `captionsUrl`, and transcript cues (`startSeconds`, `endSeconds`, `text`). See [the response fixture](video-catalog.example.json) and [OpenAPI contract](video-api.openapi.json).

- No authentication is required for these public reference videos or their files. The catalog performs no account or progress writes.
- Known topic with no video: 200 with `videos: []`. Unknown topic: 404. Empty/repeated/malformed topic parameter or unsupported query parameter: 400. Disallowed browser origin: 403. Invalid media-host configuration: 503.
- Catalog responses are `no-store`; versioned static files have public media CORS and immutable caching. File names must change when released media changes. Media supports HTTP range requests for seeking through Next's static file server.
- Current assets ship with both repositories, so no Supabase bucket or new migration is needed to demo. To host them on a public Supabase Storage/CDN later, upload all nine MP4/JPG/VTT files, preserve names, configure media CORS, and set backend `VIDEO_ASSET_BASE_URL` to the HTTPS directory URL. Redeploy the backend. Existing clients continue using returned absolute URLs. This setting does not implement private buckets or signed URLs.

## Swift integration

Copy [ReThinkAPI.swift](../examples/swift/ReThinkAPI.swift) and [ConceptVideoDemo.swift](../examples/swift/ConceptVideoDemo.swift) from the backend repository into an iOS 16+ target. The standalone demo needs Foundation, SwiftUI and AVKit, with no third-party package for public videos.

```swift
let api = ReThinkAPI(baseURL: URL(string: "https://YOUR-BACKEND.vercel.app")!)
// Present ConceptVideoDemo(api: api).
let catalog = try await api.videos(topicId: "distribution")
```

The sample uses `VideoPlayer`/`AVPlayer` and shows clickable transcript cues. An MP4 plus sidecar WebVTT does not automatically add an AVPlayer subtitle selection; the sample uses the JSON transcript instead. Production inline native subtitles need an overlay or an appropriate packaged subtitle/media track. See [Apple's VideoPlayer reference](https://developer.apple.com/documentation/avkit/videoplayer).

For authenticated learning, use the same Supabase project URL and public publishable key as the web app, via the Supabase Swift SDK. Existing web accounts work on iOS. Do not ship service-role or DeepSeek keys. Configure iOS confirmation/recovery redirect URLs separately; web redirects do not automatically open the app.

```swift
import Supabase
let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://YOUR-PROJECT.supabase.co")!,
    supabaseKey: "YOUR-PUBLIC-PUBLISHABLE-KEY"
)
try await supabase.auth.signIn(email: email, password: password)
let api = ReThinkAPI(baseURL: URL(string: "https://YOUR-BACKEND.vercel.app")!) { forceRefresh in
    if forceRefresh {
        return try await supabase.auth.refreshSession().accessToken
    }
    return try await supabase.auth.session.accessToken
}
let me = try await api.profile()
```

Use the [current session](https://supabase.com/docs/reference/swift/auth-getsession); the sample API retries authenticated read/help requests once after a 401, forcing a [session refresh](https://supabase.com/docs/reference/swift/auth-refreshsession). Show sign-in if refresh fails. Never log access or refresh tokens.

## Existing learning API boundaries

| Endpoint | Authentication | Use |
| --- | --- | --- |
| GET /api/health | Public | Backend availability/configuration |
| GET /api/videos | Public | Reviewed video metadata and playback URLs |
| POST /api/video-help | Supabase bearer token | Questions about a selected transcript passage |
| GET /api/me | Supabase bearer token | Account/profile |
| GET /api/progress | Supabase bearer token | Current legacy foundation sessions and revisions |
| POST /api/progress | Supabase bearer token | Server-validated submit/advance/reinforce/reset commands |
| GET/POST /api/curriculum | Supabase bearer token | Existing SMA lessons/checkpoints, with the current two-pretest gate |
| POST /api/feedback | Supabase bearer token | Curated/AI feedback where the stage permits it |

Send `Authorization: Bearer <current access token>` for protected calls. Progress commands use `concept`, `action`, `expectedRevision`, and for submit, `answer` and `reasoning`. On a 409 revision conflict, reload progress; do not replay blindly. Treat network failures after POST as uncertain saves: fetch progress before deciding whether to retry. Current progress writes are not a general idempotency-key API.

The 126-question SMA bank is a **draft authoring package** in the frontend repository, not yet the running diagnosis API. This video demo does not claim the broader adaptive assessment/checklist has been implemented. Swift should use existing learning endpoints only for their documented two-foundation workflow until the new assessment API is built. Videos do not grant topic mastery or unlock lessons.

## Release and verification

Deploy the backend changes first, then the frontend. No Supabase migration/new secret is required for this feature. Existing production URLs do not expose these changes until deployment. Validate backend `/api/videos`, one MP4 range request and one VTT response, then open a signed-in Video tab. Verify playback on an actual iPhone before presenting iOS compatibility as tested.

The Swift sources are integration examples; this Linux/Windows workspace cannot run Xcode or an iOS simulator. Check them in the team's iOS target. The full backend setup, account schema and learning command contract remain in backend `SETUP.md`.

## Ask about a transcript passage

Click a transcript sentence on the website to pause the video, select that exact passage and open **Pahami bagian ini**. Timestamp buttons still seek without opening the question panel. Signed-in students can edit a question and submit it; demo mode offers **Lihat penjelasan contoh**, explicitly labeled and handled locally.

Swift uses the new authenticated, read-only endpoint:

```http
POST /api/video-help
Authorization: Bearer <Supabase access token>
Content-Type: application/json

{"videoId":"distribution-v1","videoVersion":1,"cueIndex":3,"question":"Mengapa angka 2 juga dikalikan 3?"}
```

`cueIndex` is zero-based and refers to the `transcript` array of the catalog record. The server loads the canonical passage itself; clients cannot supply substitute transcript content. A stale video version returns 409 and requires reloading the catalog. Invalid selection/question returns 400, missing/invalid authentication 401, unknown video 404, oversized JSON 413, and disallowed browser origin 403.

The 200 response contains `videoId`, `videoVersion`, `cueIndex`, `explanation`, `source` (`gateway` or `curated`), optional `model`, and optional fallback `reason`. Verify the returned selection before displaying it. Render explanation as plain text; mathematical symbols are allowed. No HTML, Markdown renderer or executable expressions are needed.

The updated backend `ReThinkAPI.swift` includes:

```swift
let reply = try await api.explain(
    video: video, cueIndex: 3,
    question: "Mengapa angka 2 juga dikalikan 3?"
)
// Show reply.explanation alongside the selected passage.
// Label source == "curated" as a reference explanation, not an AI answer.
```

Use an API client with the Supabase token provider from the authentication example above. The native video demo remains a playback example; add your question form using this method. Pause AVPlayer while the student asks, keep their draft on failure, and cancel/ignore responses when they select a different passage. Get explicit submission before sending the question. The web form explains that questions and transcript context are sent through Vercel AI Gateway to its AI providers.

Provider timeouts, missing configuration, rate limits and invalid output return a curated explanation of the selected passage. This fallback may not answer a custom question; label it accordingly. The endpoint does not save questions, create chat history, mark a video watched or change mastery/progress. Authenticated help requests can retry once after a 401 because authentication happens before provider work; this does not make existing progress POSTs generally safe to replay.

### AI provider configuration

Swift continues to send only its Supabase bearer token to the ReThink backend. The backend calls DeepSeek through Vercel AI Gateway; never ship a Gateway key in iOS. `source: gateway` identifies a validated AI response; `source: curated` identifies a local fallback, including missing credentials, exhausted credits, or denied model access. See [Gateway setup](deepseek-gateway-setup.md).

### Publish the demo

Build with `npm.cmd run build`; development-only environment overrides are excluded. The frontend Vercel project must use `NEXT_PUBLIC_API_BASE_URL=https://rethinkbackend.vercel.app`. Deploy the backend changes too, including its public video files, before the frontend. Keep the production website and `http://localhost:3000` in backend `ALLOWED_ORIGINS`. Gateway credentials belong only in the backend project.

## Unified foundation pretest

The website now offers one mixed foundation test instead of topic selection. Use authenticated `GET/POST /api/assessment` from Swift, as described in [the pretest contract and deployment guide](foundation-pretest.md). The new assessment migration is required for signed-in saving and the revised curriculum gate. Anonymous demo results never write account progress.

## Expanded SMA curriculum

The shared catalog now offers general and advanced pathways, with 37 lessons and additive source/prerequisite/version metadata. See [the curriculum v2 contract and deployment guide](sma-curriculum-v2.md). The backend Swift sample includes typed catalog and checkpoint methods. Advanced completion is separate from general completion.
