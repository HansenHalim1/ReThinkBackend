# SMA curriculum v2 and Swift handoff

The website and backend share 37 original introductory lessons: 25 in the general pathway (including two prerequisite-support lessons) and 12 in the elective advanced pathway. General/advanced completion counts are separate. A student does not need to complete the advanced elective to finish the general pathway.

The update fills the earlier topic gaps: linear inequalities, exponential equations/functions, complex quadratic roots, quartiles/box plots, data-display criticism, scatterplots, inverse functions, geometric series, conditional probability, and advanced algebra, geometry, probability distributions and calculus. Every lesson now includes at least two worked examples, a common-mistake note, objectives, formulas, a checkpoint, prerequisites, and source/phase metadata.

## Curriculum basis and limits

The ministry's [23 June 2026 clarification](https://www.kemendikdasmen.go.id/siaran-pers/15636-capaian-pembelajaran-baru-telah-terbit-yang-berubah-hanya-mata-pelajaran-agama-dan-budi-pekerti) retains the 2025 CP for mathematics. The [primary 046/H/KR/2025 decision](https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf) was downloaded and checked directly: PDF pages 118–120 for general mathematics and 125–126 for the advanced outcomes. The ministry's [mathematics guide record](https://repositori.kemendikdasmen.go.id/33608/) remains a companion reference.

Phases and tracks are the alignment framework; grade placement is ReThink's suggested learning sequence. Advanced calculus is not advertised as university Calculus I equivalence. Limits are explicitly marked as supporting concepts for derivatives. SPLDV and basic probability remain available as prerequisite support with their old IDs; they are not presented as new SMA CP requirements.

The lessons are an editorial pilot with topic-level mapping. They are not exhaustive coverage of every CP skill and have not received educator review or learner-based difficulty calibration. Added examples and checkpoints are original ReThink content, not copied textbook exercises. Completing one checkpoint records lesson completion, not validated mastery.

## Shared material data

`lib/data/curriculum.v2.json` has the same bytes in both repositories; `lib/curriculum.ts` exports the shared types/catalog. The source is a versioned authoring artifact, not a public answer-key API.

Each lesson adds:

- `track`: `general` or `advanced`.
- `phase`: `E`, `F`, or `prerequisite`.
- `grade`: 10, 11, or 12, with `gradePlacement: suggested`.
- `contentVersion`, currently `2026.10.21-v2`.
- `prerequisites`: suggested lesson IDs, including legacy foundation IDs. These do not impose extra access gates.
- `bankTopicIds`: links to draft bank topics. These are alignment links, not newly released adaptive assessment items.
- `alignment`: source URL, section, mapping kind, verification status, and optional 1-based PDF page numbers.
- `additionalExamples`, `commonMistakes`, and `reviewStatus: editorial-pilot`.

All 18 existing lesson IDs, checkpoint prompts, options, grading keys and feedback remain unchanged. The nineteen new IDs are additive. Existing completion stays attached to its original checkpoint; no progress is deleted or silently reassigned.

## Web behavior

Matematika SMA offers **Matematika umum** and **Matematika tingkat lanjut**. General lessons are suggested across grades 10/11/12; advanced lessons across 11/12. Next-lesson navigation stays within the chosen pathway. The prerequisite map has 39 nodes: two legacy foundation references plus all 37 lessons, arranged across five sections without overlapping nodes. The unified eight-topic pretest remains the access gate; it is not replaced by these legacy references.

The explorer exposes all lessons without changing progress. Existing models remain available, with new interactive examples for inequalities, inverse mappings, geometric series and positive-area integration. Every new topic now has a mathematical diagram and meaningful model control. All 39 current references have a packaged video; see [the complete concept media release](complete-concept-media.md). `advanced-derivatives` keeps its existing video ID and visualization.

## Backend and Swift

Authenticated `GET /api/curriculum` keeps `unlocked`, `modules`, and `progress`, and adds:

```json
{
  "curriculumVersion": "2026.10.21-v2",
  "tracks": [
    { "id": "general", "title": "Matematika umum", "description": "…" },
    { "id": "advanced", "title": "Matematika tingkat lanjut", "description": "…" }
  ]
}
```

Every module includes the metadata above. Filter modules by the student's selected `track` and then by suggested `grade`; compute completion over that filtered pathway. Advanced remains an explicit elective choice. Clients may ignore unknown additive fields. Do not hard-code a module count or require advanced completion for general completion.

`POST /api/curriculum` remains `{ moduleId, answerId, expectedRevision }`, using the student's Supabase bearer token. The backend grades the checkpoint and returns `{ correct, explanation, progress }`. Use the revision from the latest progress row; a 409 requires reload/review rather than automatic replay. Account identity and completion cannot be supplied by the client. Catalog quiz payloads omit `correctOption` and quiz `explanation`; worked lesson examples are intentionally visible. Browser demo checkpoint grading uses the bundled lesson content and saves only in memory.

The [OpenAPI contract](curriculum-api.openapi.json) describes the complete catalog/checkpoint schema. The backend [Swift example](../examples/swift/ReThinkAPI.swift) now includes `CurriculumCatalog`, `CurriculumLesson`, `curriculum()` and `answerCurriculum(...)`. It has not been compiled in Xcode. Swift should render formulas/examples as plain Unicode text; no HTML evaluation is required. The existing authenticated API, CORS rules, and per-account revision protection are retained.

## Deployment

Apply migrations in order, including the previous unified-assessment migration and the new `supabase/migrations/202610210002_curriculum_v2.sql`. The new migration expands the existing allowed module IDs to all 37, preserving every old ID and progress row. Deploy the backend first, then the frontend. No new environment variable is required. Without the new constraint migration, reading the catalog can work while saving a new lesson fails; do not treat that as successful deployment.

Both new migrations are prepared locally, not applied to the live Supabase project by this task. The anonymous demo at http://localhost:3000 works without applying them. Signed-in saving must be checked with the real deployed schema after migration.

## Still separate work

AI-selected follow-up assessment questions, release/review of the remaining 102 draft bank items, deeper multi-question practice per skill, educator review, and live deployment verification are not part of this curriculum-map/content release.

## Verification

All 19 frontend and 25 backend tests passed. Tests cover identical legacy checkpoint grading, all 37 lesson structures, all 34 non-foundation bank-topic mappings, acyclic/nonoverlapping prerequisite nodes, authenticated grading of new modules, and the expanded module constraint applied to actual embedded PostgreSQL. General/advanced progress remains per account with revision conflict protection.

Both production builds passed. Chromium completed all 12 advanced checkpoints, checked all 19 new reference/visual states and video topic IDs, verified independent 25/12 progress totals, and followed the 39-node map into a calculus lesson. Synthetic account transport verified existing progress display and blocking/retry for an outdated backend catalog. Existing video playback/captions/seeking and transcript-help suites passed. A fresh mobile viewport verified the integral display and controls; no live Supabase migration or Xcode build was performed.

The release contains 79 worked examples in total. See [the advanced roadmap screenshot](curriculum-advanced-desktop.png) and [mobile integral example](curriculum-integral-mobile.png). The subsequent [complete media release](complete-concept-media.md) adds mathematical model views and videos for every topic.
