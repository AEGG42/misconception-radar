# July 29 feature freeze

Freeze candidate prepared early on **2026-07-25 (Asia/Shanghai)** for the
July 29 gate.

## Frozen judged flow

1. Select one of three bounded physics exit tickets.
2. Load the eight-person synthetic demo class or upload a validated CSV.
3. Send anonymous IDs and responses to the server-side DeepSeek provider.
4. Review the misconception map, deterministic class metrics, and exact
   evidence quotes.
5. Edit and approve feedback locally.
6. Generate a three-step, five-minute reteach plan.
7. Export reviewed feedback as a spreadsheet-safe UTF-8 CSV.

The collision demo story is locked to a three-student **Heavier = more force**
cluster. Maya is the default evidence detail so the dashboard, student story,
reteach focus, screenshots, and narration all describe the same signal.

## Frozen technical decisions

- Next.js App Router, React, TypeScript, Tailwind CSS, Zod, Recharts, and Papa Parse.
- DeepSeek V4 Flash in non-thinking JSON mode for the judged build.
- No database, login, LMS, PDF/OCR, voice, image, or persistence scope.
- Student names remain client-side; the app stores no response history.
- Criterion-level points are the score source; aggregates are recomputed in code.
- Invalid IDs, enums, rubric criteria, and evidence quotes reject the batch.
- The fixed sample snapshot remains a clearly labeled outage fallback.

## Changes allowed after freeze

- Blocking correctness, privacy, accessibility, or deployment fixes.
- Devpost copy, screenshots, captions, video edits, and final public URLs.
- Dependency or platform changes required to keep the existing build online.

## Changes not allowed after freeze

- New subjects, templates, providers, agents, storage, authentication, or LMS features.
- Prompt/model changes without rerunning the three-pass live evaluation gate.
- Claims of classroom validation or automatic grading.
- Any workflow that sends names to the server or automatically sends feedback.

## Release evidence

- Three live runs: 100% primary-misconception match, 96.67% score tolerance,
  and 100% integrity on 30 synthetic cases.
- Unit and contract tests cover CSV safety, anonymization, deterministic
  aggregation, model contracts, and the fixed demo cluster.
- Playwright covers upload, analysis, evidence review, editing, approval,
  export, reteach, outage fallback, and 390 px responsive use.
- The production smoke test must return `provider: deepseek` before release.

## Remaining submission-only work

- Publish and verify the public GitHub repository.
- Replace the GitHub placeholder in the video end card.
- Record, edit, upload, and verify the sub-two-minute video.
- Add source/video URLs and submit the Devpost entry.
