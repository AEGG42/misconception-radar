# Submission release checklist

Last reviewed: **2026-07-25 (Asia/Shanghai)**

## Working release

- [x] Public application: <https://misconception-radar-july-ai-2026.aegg42.chatgpt.site>
- [x] Public homepage, analysis API, and reteach API pass an anonymous smoke test.
- [x] Three physics templates, synthetic demo data, CSV import, evidence-backed diagnostics, teacher review, reteach plan, and feedback export are implemented.
- [x] Lint, strict TypeScript, unit/contract tests, browser tests, and the Sites production package pass locally.
- [x] Devpost thumbnail and three product screenshots are prepared.

## External release gates

- [ ] Publish the source to a public GitHub repository and verify it while logged out.
- [ ] Decide whether the judged build will use the authorized live model or the clearly labeled deterministic baseline.
- [ ] If live mode is enabled, run the 30-case evaluation three times and record accuracy, score tolerance, variance, latency, and model name.
- [ ] Record and edit the final 1:54 demo video.
- [ ] Upload the video to YouTube, Vimeo, or Youku with embedding enabled.
- [ ] Add the public source and video URLs to the app end card, README, and Devpost draft.
- [ ] Complete and submit the Devpost entry.

## Release commands

```bash
npm ci
npm run verify
npm run test:e2e
npm run test:production
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
