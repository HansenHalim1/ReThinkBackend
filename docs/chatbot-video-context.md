# Chatbot and video context

The Chatbot navigation tab places a video player and timed transcript beside a conversation. Every ReThink lesson/explorer video uses the same player. Click a transcript sentence to seek and select it, then choose **Tambahkan bagian ke chatbot**. The app opens Chatbot with the embedded video, selected passage and an explicit context chip. **Gunakan seluruh transkrip sebagai konteks** attaches the whole transcript instead. YouTube context is now automatic once a transcript loads (see the playback section below). Only one explicitly selected video context is attached at a time; replacing or removing it changes subsequent requests. Earlier messages retain their source label.

Playback highlights the currently active sentence; the selected passage has a separate outline. A checkbox enables transcript auto-follow. Seeking through native video controls or the transcript updates the highlight. YouTube uses the official iframe player API and polls playback position every 250 ms. Players pause when leaving the chatbot or handing a passage over from a lesson. On mobile the columns stack and attaching context brings the conversation into view. Quick passage explanations remain available inside lessons.

Conversations and imported subtitles remain in page memory when switching tabs. Reloading or signing out discards them; there is no chat database migration or cross-device history yet. Production AI calls require the existing Supabase session and backend Gateway credentials. Demo replies are explicitly labeled curated examples; they do not answer arbitrary questions through AI.

## YouTube setup

Paste an HTTPS watch, youtu.be, Shorts, live or embed URL. Public videos must allow embedding and remain accessible to the viewer; age, region, privacy and owner restrictions can prevent playback.

Set **SUPADATA_API_KEY** only in the backend environment (Vercel and local development), then restart/redeploy the backend. Automatic captions use `GET https://api.supadata.ai/v1/transcript?url=…&text=false&mode=native&lang=en` with an `x-api-key` header. This is a separate caption service; Vercel AI Gateway credit does not cover it. The implementation requests existing native captions and does not automatically order AI transcription. No key was created or external account registered as part of this change.

Automatic retrieval is authenticated. Demo mode, absent provider configuration, missing captions, quota/service errors or pending caption jobs show an actionable message while leaving the video available. Paste an SRT or WebVTT subtitle file into **Impor atau ganti subtitle SRT / VTT** to use your own timed transcript. Untimed plain text is rejected because it cannot synchronize accurately. Imported subtitles are visibly labeled student supplied. Caption text and titles are treated as untrusted input by the tutor, and YouTube transcripts supplied by a client are not claimed as independently verified.

Reference: [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference), [YouTube caption authorization](https://developers.google.com/youtube/v3/guides/implementation/captions), [Supadata transcript API](https://github.com/supadata-ai/skills/blob/main/skills/supadata/references/video.md).

## Native/API contract

Both endpoints use `Authorization: Bearer <Supabase access token>`, JSON, existing CORS rules, no-store responses and a 30 second route budget. Provider keys never belong in a web or Swift app.

`POST /api/youtube-transcript`

```json
{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","language":"en"}
```

Success returns `id`, `title`, `language`, `transcriptOrigin: "provider"`, and `transcript: [{startSeconds, endSeconds, text}]`. Timings are seconds, not provider milliseconds. Titles currently use the safe fallback `YouTube · <id>`; no metadata scrape is performed. Errors use `{error: string}`: 400 invalid URL, 401 expired/missing session, 422 unavailable native captions or pending job, 429 burst limit, 502 invalid provider response, 503 missing configuration/provider failure. Do not repeatedly retry unavailable captions; offer subtitle import instead.

`POST /api/chat`

```json
{
  "question":"Jelaskan bagian ini langkah demi langkah.",
  "messages":[{"role":"user","content":"Mengapa pengalinya tetap sama?"}],
  "context":{"kind":"catalog","id":"distribution-v1","version":1,"cueIndex":1}
}
```

Catalog contexts contain only `kind`, `id`, `version`, and `cueIndex`. The server resolves the canonical video and transcript, rejects extra/forged fields, and returns 409 for a stale version. **Explicit `cueIndex: null` means the whole transcript**. JSON omission of `context` or `context: null` means no attached video.

For YouTube automatic context, pass the loaded transcript and current playback time. Set cueIndex to null to focus on playback, or a valid index to focus on an explicitly selected passage. Legacy one-cue contexts remain accepted:

```json
{
  "question":"Apa maksud langkah ini?",
  "messages":[],
  "context":{
    "kind":"youtube",
    "id":"dQw4w9WgXcQ",
    "title":"YouTube · dQw4w9WgXcQ",
    "cueIndex":null,
    "transcript":[{"startSeconds":10,"endSeconds":18,"text":"Teks bagian yang dipilih."}]
  }
}
```

Success returns `{answer, source: "gateway", model}` or a clearly labeled `{answer, source: "curated", reason}` for a catalog fallback. With no applicable curated explanation, unavailable AI returns 503 instead of a fabricated answer. Messages are at most 10 recent user/assistant turns (24,000 total characters); questions at most 1,600 characters. Keep transcript text and timestamp overhead within 24,000 characters; for long videos attach one passage. 413 means reduce context/history. Responses are plain text and never include provider reasoning or credentials.

A per-instance burst guard permits up to 20 chat and 6 transcript requests per authenticated user per minute. It is not a shared production quota across Vercel instances; deploy a shared limiter if a global budget is required.

`examples/swift/ReThinkAPI.swift` adds `chat(question:messages:context:)`, `youtubeTranscript(url:)`, `StudyChatContext`, and decoded reply types, reusing the existing token-refresh transport. For example:

```swift
let reply = try await api.chat(
    question: "Mengapa langkah ini benar?",
    context: .catalog(video: video, cueIndex: 1)
)
let imported = try await api.youtubeTranscript(url: youtubeURL)
let youtubeReply = try await api.chat(
    question: "Jelaskan bagian ini.",
    context: .youtube(id: imported.id, title: imported.title, transcript: [imported.transcript[0]])
)
```

Swift's context encoder writes explicit JSON null for whole-transcript selection. A native UI can use AVPlayer periodic time observation for catalog videos and the YouTube iframe API in WKWebView for YouTube, retaining the original platform player. Highlight with `startSeconds <= currentTime && currentTime < endSeconds`; do not highlight across gaps. Tap a cue to seek, then let the student explicitly attach it to the chat. Swift code is a handoff example and has not been compiled in Xcode here.

## Verification

Frontend/backend unit tests cover safe URL normalization, SRT/VTT timing and gap behavior, canonical context ownership, stale/forged/oversized requests, authentication/CORS, curated fallback, provider timing normalization, pending jobs and missing credentials. Both production builds pass. Chromium checks cover desktop/mobile lesson-to-chat handoff, selected/playing highlights, seeking, context replacement/removal, conversation continuity and imported YouTube captions. YouTube seek/poll is exercised with an explicit player test double; the real YouTube iframe was separately loaded. Live automatic caption retrieval still needs a configured provider key, and paid AI responses were tested with mocked Gateway transport.

Demo screenshots: [desktop](chat-desktop.png), [mobile](chat-mobile.png). Verified 54 unit tests (23 frontend, 31 backend) and both production builds.

## Subtitle language selection

YouTube defaults to English (`en`), with Bahasa Indonesia (`id`) selectable before import or while viewing a video. The chosen preference is saved in browser local storage. Changing language reloads the timed transcript and updates the YouTube embed's `hl`, `cc_lang_pref`, and `cc_load_policy=1` preferences while retaining playback position. Existing attached context from the same video is cleared so an older-language passage is not sent accidentally. New selections can be attached again.

`POST /api/youtube-transcript` accepts optional `language: "en" | "id"`; omission defaults to English for older clients. The backend forwards `lang` to Supadata and checks the actual returned language, including language-tag variants and chunk metadata. If the service returns a different language, the endpoint returns 422 rather than displaying it. Missing English/Indonesian captions are not automatically translated; choose the other language or import matching SRT/VTT subtitles.

YouTube's embedded caption track is a platform preference: track availability and user settings can still affect its choice. Use the player's CC/Settings menu if its captions differ. The separate transcript panel rejects unintended language fallback. ReThink catalog videos currently provide Indonesian captions only. The selector does not translate their on-screen mathematical explanations or imported subtitle text.

Swift: `try await api.youtubeTranscript(url: youtubeURL, language: "id")`. The default argument is `"en"`. The sample rejects mismatched response languages. Browser regression checks cover the language picker, saved preference, API/player settings, retained position, unavailable-language errors and cleared stale context. Provider and player behavior are mocked; a real provider call still requires live credentials.

## Automatic YouTube context and playback

Once a YouTube transcript loads, Chatbot automatically includes it with each submitted question; no attach action is required. The composer shows the current video time and active passage. Playback itself does not make AI requests. At submission, the web reads the player's current time directly, rather than relying on the last UI polling tick. Each message retains the captured timestamp, even if playback continues while the answer is generated.

`context.playbackSeconds` is a finite value from 0 through 86,400. The backend derives `currentPassage` from `startSeconds <= playbackSeconds < endSeconds`; gaps and the end of a subtitle have no active passage. Clients cannot forge this derived field in a request. YouTube `cueIndex` now accepts a numeric index into the supplied transcript to identify an explicit student focus; null keeps the current passage as the default focus. The server derives `selectedPassage` separately and instructs the tutor to distinguish a deliberate selection from current playback.

For transcripts exceeding the existing 24,000 character budget including timestamp overhead, the web automatically builds an ordered excerpt containing the current passage, the explicitly selected passage if any, and nearby cues, with `transcriptScope: "excerpt"`. Smaller transcripts use `"full"`. Original timestamps are preserved and selected indices are remapped into the supplied excerpt. The tutor is told when it only has excerpts and must not claim to know omitted portions or assume future transcript passages have already been watched.

Students can uncheck **Gunakan konteks video otomatis** to ask without automatic video context. Clearing an explicitly selected focus returns to automatic playback context. Switching videos clears old manual focus and resets playback; changing caption language reloads current-language context without an old-language passage. Unavailable transcripts are never invented. Imported timed subtitles enable the same automatic context, with their existing student-supplied disclosure. Demo mode continues to show curated examples instead of live AI answers.

Native clients should capture player time in the question-submit action and pass it alongside the transcript:

```swift
let reply = try await api.chat(
    question: "Jelaskan bagian yang sedang diputar.",
    context: .youtube(
        id: imported.id,
        title: imported.title,
        transcript: imported.transcript,
        playbackSeconds: currentPlayerTimeSeconds
    )
)
```

Use `cueIndex: selectedIndex` for an explicit focus while retaining the surrounding transcript. For long videos, select excerpts within the budget and set `transcriptScope: "excerpt"`; remap the focus index into those excerpts. Older requests without playbackSeconds continue to work. Swift is an uncompiled integration example. The web and backend tests cover full/excerpt selection, exact submit-time snapshots, focus precedence, subtitle gaps, invalid timestamps and source/language replacement.
