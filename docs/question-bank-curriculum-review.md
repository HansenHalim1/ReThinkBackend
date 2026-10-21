# Question bank curriculum review

Research date: 21 October 2026. Scope: Indonesian SMA mathematics.

## Official baseline

Use **Keputusan Kepala BSKAP 046/H/KR/2025** as the mathematics learning-outcome baseline. The ministry's 23 June 2026 announcement says amendment 020/2026 changes only Agama dan Budi Pekerti; other subjects retain the 2025 outcomes.

- [Ministry clarification, 23 June 2026](https://www.kemendikdasmen.go.id/siaran-pers/15636-capaian-pembelajaran-baru-telah-terbit-yang-berubah-hanya-mata-pelajaran-agama-dan-budi-pekerti)
- [Official 2025 decision PDF](https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf)
- [Official 2025 mathematics teaching guide and publication record](https://repositori.kemendikdasmen.go.id/33608/)

The guide distinguishes general mathematics from the Fase F advanced elective. Use phases as the authoritative alignment; XI/XII placement is a learning-sequence choice.

## Coverage to map

This is a topic summary, not a complete transcription of the CP. See sections 5–6, printed pages 17–18 of the [2025 guide](https://repositori.kemendikdasmen.go.id/33608/1/5.%20Final%20Panduan%20Mata%20Pelajaran%20Matematika_12_09_2025_Revisi%203.pdf).

| Phase | Coverage |
| --- | --- |
| E, generally X | Fractional exponents; systems of linear inequalities in two variables; quadratic equations/functions including imaginary roots; exponential equations/functions; acute-angle trigonometric ratios; quartiles, data displays, scatterplots, and critical interpretation of statistics. |
| F, generally XI–XII | Sequences/series; interest and annuities; inverse/composite/transformed functions; circle relationships; categorical/numerical associations and linear fit; association versus causation; compound/conditional probability, independence, disjoint events, permutations/combinations. |

Keep prerequisites separately tagged: signed arithmetic, fractions, ratios, percentages, algebraic manipulation, linear equations, coordinates, and basic data/probability. This prerequisite list is a ReThink design proposal.

### Calculus and the advanced track

Calculus belongs in the bank's advanced mathematics track. The 2025 guide explicitly includes limits, differentiation, integration, and applications in its advanced calculus element (printed page 10). These overlap introductory university calculus, but should be labelled by actual SMA skills rather than claiming equivalence to a university Calculus I course. The official [kelas XII advanced mathematics textbook](https://buku.kemendikdasmen.go.id/katalog/matematika-tingkat-lanjut-untuk-smama-kelas-xii) is an additional reference for grade-level sequencing. The general-track table above is not the full SMA mathematics offering.

## Textbook references

- [Revised general mathematics X, official SIBI catalogue](https://buku.kemendikdasmen.go.id/katalog/matematika-untuk-smamasmkmak-kelas-x-edisi-revisi).
- [General mathematics XI, official SIBI catalogue](https://buku.kemendikdasmen.go.id/katalog/matematika-untuk-smasmk-kelas-xi). This listing is not labelled a revised edition; do not advertise it as a 2025/2026 revision.
- [Revised advanced mathematics XI, official SIBI catalogue](https://buku.kemendikdasmen.go.id/katalog/matematika-tingkat-lanjut-untuk-sma-ma-kelas-xi-edisi-revisi). Use only for the elective track.

Textbook chapter order must be reconciled with current CP, rather than treated as the curriculum itself. A recent catalogue crawl/upload date does not establish a book's publication year.

## Repository findings

- `lib/content.ts` limits diagnostic concept IDs to `distribution` and `inverse`. Numerous generated variants do not supply broad SMA diagnostic coverage.
- `lib/curriculum.ts` contains 18 introductory materials with one multiple-choice checkpoint each. Those checkpoints are not a diagnostic bank.
- The linear-systems material teaches and checks SPLDV. Preserve it as a prerequisite, and add a distinct current-phase inequalities topic.
- Exponents/logarithms share a material, but exponential equation/function coverage needs its own assessable skills.
- Statistics needs finer skills for representations, interpretation, and misleading conclusions; arithmetic-only questions cannot cover these.
- Existing saved IDs and backend copies require a migration plan before changing live content.

## Proposed bank update

1. Create stable topic/skill IDs with phase, track, prerequisites, and exact CP source/section. Retain separate optional grade suggestions.
2. Author original Indonesian questions per skill across entry, routine, and reasoning/application levels. Treat difficulty labels as provisional until response data supports them.
3. Record answer type, server-side grading specification, worked solution, distractor rationale, misconception tags, and content version. Do not assume the current linear-expression parser can grade all SMA content.
4. Review topic coverage and mathematical correctness before multiplying templates. Distinguish numeric variants from independent question families.
5. Publish a versioned backend bank shared by web and Swift. Return renderable question data without answer keys; let AI select eligible reviewed items.

No live question bank, learning gates, assessment rules, or backend data were changed by this review. At the initial review, full guide downloads failed and phase coverage was checked against indexed official guide excerpts. During the subsequent curriculum implementation, the full 2025 CP decision was downloaded and its mathematics sections were checked directly (PDF pages 118–120 and 125–126). See [the implemented curriculum mapping](sma-curriculum-v2.md); this remains topic-level coverage rather than exhaustive CP alignment.
