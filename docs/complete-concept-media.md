# Complete concept media release

Every current SMA lesson and foundation reference has an interactive visualization and a packaged teaching video: **37 SMA lessons + 2 foundation references = 39 topics**. The shared catalog contains 39 videos and 156 captioned SVG stages. The website also offers direct model controls. Media is accessible from the explorer and directly inside each SMA lesson.

## What students see

Each new visualization has a specific question, a meaningful parameter, a mathematical diagram, a computed result, and a short takeaway. Four guided example buttons connect the diagram to an explanation. The remaining generic step-list placeholders have been removed. Existing interactive models and the secant-to-tangent visualization remain available.

Videos focus on one central example per lesson. The 36 new films use four nine-second diagram states, clear labels, color distinctions, and on-screen calculations. Together with the three original pilots, they cover all 39 topics. Videos are silent and captioned in Indonesian; they do not have spoken narration. Transcripts are clickable, with a curated explanation for every passage and authenticated DeepSeek help through the existing backend. Videos do not track completion or assign mastery.

The generated library is H.264/yuv420p, 960×540 at 24fps. New films are 36 seconds; preserved pilots are 26/27/29 seconds. MP4 files total about 14 MB. Use fullscreen for the most legible video diagrams; transcript explanations remain available as normal text.

These are concise introductions to each lesson's main idea, not exhaustive videos for every subskill. Existing curriculum educator-review limitations still apply. The rendering pipeline is deterministic and does not spend AI Gateway credits.

## One authored model, shared outputs

- `lib/data/teaching-stories.v1.json`: original topic questions, parameter ranges, four cue texts, and takeaways.
- `lib/teaching-scenes.ts`: computed diagram geometry and results, with XML-safe SVG serialization. The models handle zero denominators, a missing function value at a limit, zero determinants, probability endpoints, and changing geometric/financial quantities.
- `components/topic-visualization.tsx`: interactive parameter and guided stages. Existing dedicated controls remain in the explorer; all lesson pages include visualization/video tabs through `components/lesson-media.tsx`.
- `media/manim/export-scenes.mjs`: exports the same model states for video rendering and 156 standalone versioned SVGs.
- `media/manim/lesson_films.py`: Manim Community 0.19.0 renderer with original mathematical diagrams and readable result labels. It uses Text, so TeX is not required.
- `media/manim/render-lessons.py`, `publish-release.py`, and `verify-release.py`: render, check, package, and publish local manifests only after every asset is available.

All 36 new videos are real rendered MP4 assets. No placeholder URLs or per-request render jobs are used. Source diagrams include graphs, vectors, transformed regions, unit circles, box plots, probability bars, function flows, counting grids, tangent lines, and shaded integrals.

## Rebuild and synchronize

Activate the pinned Manim environment described in [the renderer guide](../media/manim/README.md). Use Node.js 24 for the TypeScript export tool. Run from the frontend root:

```sh
bash media/manim/render-all.sh
```

Intermediate media and logs go under `/tmp/rethink-topic-renders` and the ignored `media/manim/generated/` directory. Two renderer processes are used by default; `RETHINK_RENDER_WORKERS` changes concurrency. Existing complete render files can be reused during this first release. To rerender an unpublished sample, remove its generated MP4 first. After publishing, bump media versions/filenames before changing released assets because URLs are immutable-cached.

Synchronize both catalog JSON files, the visualization catalog, and the entire `public/videos/` directory to the backend. This includes the `visuals/` subdirectory. Media fixtures and Swift/API docs should be updated together. The backend serves files locally by default; `VIDEO_ASSET_BASE_URL` can point to an external public media directory containing that same layout. No Supabase Storage bucket is required.

This media release requires no new database migration. Previously documented assessment/curriculum migrations remain required for signed-in learning progress. No external storage upload or production deployment has been performed.

## Public API and Swift

`GET /api/videos?topicId=advanced-binomial` returns the existing video contract with MP4, JPEG, VTT, and transcript URLs. Omit the filter to receive all 39. Every current topic has one clip. Original pilot IDs/versions are preserved.

`GET /api/visualizations?topicId=advanced-binomial` returns:

```json
{
  "schemaVersion": 1,
  "catalogVersion": "2026.10.21-v1",
  "visualizations": [{
    "id": "advanced-binomial-visual-v1",
    "version": 1,
    "topicId": "advanced-binomial",
    "title": "Hitung banyak keberhasilan",
    "interaction": "stage-selector",
    "width": 640,
    "height": 240,
    "stages": [{
      "index": 0,
      "value": 0.2,
      "caption": "…",
      "result": "…",
      "svgUrl": "https://YOUR-BACKEND/videos/visuals/advanced-binomial-visual-v1-step-1.svg"
    }]
  }]
}
```

The actual payload also includes `question`, `takeaway`, `parameter` (label/min/max/step/initial), and exactly four ordered stages. It supports native **stage selection**, with SVGs already rendered. The web additionally computes intermediate parameter values locally. Do not interpolate the native SVGs and assume the result is a correct arbitrary-parameter simulation.

Both public APIs are read-only, require no sign-in, and return no account data. Browser CORS applies to catalogs; media files allow public cross-origin reading. Invalid/repeated/unknown query fields return 400, unknown topics 404, denied origins 403, and invalid media-host configuration 503. Catalog responses are no-store; versioned media is immutable-cached. No signed URLs or service keys belong in native clients.

The backend Swift sample adds `visualizations(topicId:)` and `ConceptVisualizationDemo.swift`, which renders authored SVG stages in a JavaScript-disabled WKWebView with caption/result text outside it. Video playback and transcript questions continue to use the existing Swift examples. Swift samples still require an Xcode build and device testing by the iOS team.

## Verification

All 39 MP4s were decoded and checked: H.264, yuv420p, correct dimensions/durations, no audio track, and four nonblank sampled frames each. The library has 156 transcript passages with curated fallback explanations. All 156 SVGs are authored static assets without scripts. Contact sheets were visually inspected across the complete library.

The app test suites passed 21 frontend and 26 backend tests, including full media coverage, control/diagram geometry, undefined-function versus limit behavior, singular matrices, binomial expectations, conditional versus compound probability, safe SVG URLs, CORS, ownership, and transcript grounding. Both production builds passed. Chromium verified all 39 topics: model controls, video decoding/playback, exact active captions after seeking, byte-range delivery, and every clickable passage explanation. Direct lesson media and fresh mobile diagram/video views also passed. The final full-library browser run also passed the enlarged diagram dialog on mobile. Live iOS/Xcode compilation and production hosting are not verified by these checks.

Screenshots: [interactive diagram on mobile](complete-media-visual-mobile.png) · [video and transcript help on mobile](complete-media-video-mobile.png). Rendering contact sheets: [1](media-contact-1.jpg), [2](media-contact-2.jpg), [3](media-contact-3.jpg), [4](media-contact-4.jpg).
