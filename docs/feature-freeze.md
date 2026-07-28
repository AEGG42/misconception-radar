# July 29 feature freeze

Freeze candidate prepared early on **2026-07-25 (Asia/Shanghai)** for the
July 29 gate.

## July 29 scope amendment

The assignment picker now includes a teacher-authored custom exit ticket.
Teachers provide the question, reference answer, four rubric look-fors, and
three common incorrect ideas. The same anonymization, evidence-integrity,
teacher-review, reteach, and export boundaries apply. Custom-prompt results
are not covered by the original 30-case qualification claim; the deterministic
fallback marks every custom result for review.

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

- Further new subjects, bundled templates, providers, agents, storage,
  authentication, or LMS features beyond the July 29 custom-ticket amendment.
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
- Production version 6 returned `provider: deepseek`; homepage, analysis, and
  reteach checks were HTTP 200, with evidence and all three reteach steps.

## Remaining submission-only work

- Publish and verify the public GitHub repository. **Completed 2026-07-28.**
- Replace the GitHub placeholder in the video end card. **Completed 2026-07-28.**
- Record and edit the sub-two-minute video. **Completed 2026-07-28; upload pending authenticated YouTube access.**
- Add source/video URLs and submit the Devpost entry.
