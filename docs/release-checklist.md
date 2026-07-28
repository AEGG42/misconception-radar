# Submission release checklist

Last reviewed: **2026-07-28 (Asia/Shanghai)**

## Schedule progress

- [x] **July 25:** application foundation, three templates, synthetic data, CSV import, and Devpost draft.
- [x] **July 26:** deterministic-provider vertical slice from import through dashboard, student evidence, editable approval, reteach generation, and failure fallback. Completed early on July 25.
- [x] **July 27:** DeepSeek V4 Flash adapter, JSON/Zod validation, one retry, provider routing, human-review states, and reteach contract. Completed early on July 25.
- [x] **July 28:** 30-case evaluation gate, exceptional flows, labeled snapshot, DeepSeek production version 5, and anonymous production smoke test. Completed early on July 25.
- [x] **July 29:** feature freeze, coherent three-student demo cluster, spreadsheet-safe feedback export, 390 px responsive verification, README/Devpost polish, refreshed live-AI screenshots, draft video overlays, and production version 6. Completed early on July 25.

## Working release

- [x] Public application: <https://misconception-radar-july-ai-2026.aegg42.chatgpt.site>
- [x] Production version 6 homepage, DeepSeek analysis API, and DeepSeek reteach API pass an anonymous synthetic-data smoke test.
- [x] Three physics templates, synthetic demo data, CSV import, evidence-backed diagnostics, teacher review, reteach plan, and feedback export are implemented.
- [x] Lint, strict TypeScript, unit/contract tests, browser tests, and the Sites production package pass locally.
- [x] Devpost thumbnail and three product screenshots are prepared.

## External release gates

- [x] Publish the source to a public GitHub repository and verify it while logged out: <https://github.com/AEGG42/misconception-radar>
- [x] Add a server-side DeepSeek credential without committing or exposing it.
- [x] Run the 30-case DeepSeek evaluation three times and record accuracy, score tolerance, variance, latency, and model name. Passed on July 25: 100% misconception match, 96.67% score tolerance, and 100% integrity in every run.
- [x] Enable DeepSeek in the judged build only if every acceptance threshold passes. Production version 5 uses environment revision 2.
- [x] Record and edit the final 1:54 demo video. Local candidate: `artifacts/video/misconception-radar-demo.mp4`.
- [ ] Upload the video to YouTube, Vimeo, or Youku with embedding enabled.
- [ ] Add the public source and video URLs to the app end card, README, and Devpost draft.
- [ ] Complete and submit the Devpost entry.

## Release commands

```bash
npm ci
npm run verify
npm run test:e2e
npm run test:production
npm run evaluate:live
```

The production smoke test uses only synthetic responses. Override its target
with `PRODUCTION_URL` and optionally lock the expected engine with
`EXPECTED_PROVIDER`.

## Claim guardrails

- Call all feedback a **draft** and keep teacher review visible.
- Do not describe the deterministic baseline as live model inference.
- Do not claim classroom validation; the current evaluation set is synthetic.
- Do not claim names are sent to or stored by the server.
- Keep the provider badge and any sample-snapshot banner visible in the video.

## Deadline gates

- **2026-07-27:** live-provider decision and evaluation gate.
- **2026-07-28:** production and submission-link freeze candidate.
- **2026-07-29:** feature freeze; only P1 polish.
- **2026-07-30 20:00 Beijing time:** internal Devpost submission target.
- **2026-07-31 11:45 Beijing time:** earlier official deadline shown by Devpost.
