# Evaluation design

## Purpose

The evaluation set checks whether a provider can support the product contract before its output is shown as a teacher-facing draft. It is not a claim of classroom validity.

## Dataset

Thirty synthetic, human-labeled responses are kept in `tests/evaluation.test.ts`:

- 10 car–truck collision responses;
- 10 book-at-rest responses;
- 10 constant-speed elevator responses.

Each assignment includes:

- at least one substantially correct response;
- two phrasings for several common misconceptions;
- responses that test velocity/acceleration, force-pair, and net-force distinctions;
- an expected primary misconception or `null`;
- a human draft score on the four-point assignment rubric.

No real student data is used.

## Automated acceptance thresholds

| Measure | Threshold | Why |
| --- | ---: | --- |
| Primary misconception match | ≥ 85% | The dominant class pattern must be useful enough to act on |
| Draft score within one rubric point | ≥ 90% | Scores are formative drafts, but large deviations are unacceptable |
| ID, enum, rubric-sum, and evidence integrity | 100% | Structural failures must never reach the teacher UI |

Run with:

```bash
npm run test
```

## Live-provider gate

The live evaluator batches the 30 cases by assignment and repeats the complete
set three times. It also validates one generated reteach plan. Configure a
server-side provider key in the ignored `.env.local`, then run:

```bash
npm run evaluate:live
```

The default live provider is `deepseek` with `deepseek-v4-flash`; set
`LIVE_EVAL_PROVIDER=openai` only when intentionally evaluating the alternate
adapter. The runner enables live mode only for the evaluation process and
writes a sanitized report to `test-results/live-evaluation.json`. The report
contains only provider/model metadata, accuracy, score tolerance, integrity,
variance, and latency—never student responses or credentials.

## DeepSeek qualification result

DeepSeek V4 Flash passed the live-provider gate on **2026-07-25** using the
pinned prompt, non-thinking JSON mode, and the 30 synthetic cases:

| Run | Primary misconception match | Score within one point | Integrity | Analysis duration |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 100% | 96.67% | 100% | 70.24 s |
| 2 | 100% | 96.67% | 100% | 72.20 s |
| 3 | 100% | 96.67% | 100% | 67.58 s |

The mean primary-misconception accuracy was 100% with zero run-to-run range.
The mean score-within-one rate was 96.67% with zero run-to-run range. The
three-step reteach-plan contract also passed.

An initial diagnostic run exposed a repeatable disagreement between the
model's redundant `rubricScore` field and its four criterion-level `earned`
values. The application now treats the validated criterion breakdown as the
single score source and recomputes the total deterministically. Unknown,
missing, or repeated criterion IDs remain hard integrity failures. See the
[sanitized qualification report](live-evaluation.json).

## Evidence checks

After provider output:

1. The server requires exactly one result for every submitted student ID.
2. Returned IDs must match the input set exactly.
3. Misconception IDs must belong to the selected assignment.
4. Every rubric criterion ID must appear exactly once; the total score is recomputed from those validated criterion points.
5. Every evidence quote must be an exact normalized substring of the corresponding response.
6. Any failure rejects the whole batch; partial or fabricated feedback is not displayed.

## Human review protocol for a live provider

Before enabling a live model:

1. Run the same 30 cases at least three times with the pinned prompt and model.
2. Report mean accuracy and run-to-run variance.
3. Independently review feedback for tone, scientific correctness, actionability, and whether it gives away the final answer.
4. Add every failure as a regression case before changing the prompt.
5. Keep live mode disabled if the thresholds are not met.

## Limitations

- Synthetic cases are smaller and cleaner than authentic classroom writing.
- Self-reported confidence is not a calibrated probability.
- English-only phrasing may underrepresent multilingual learners.
- Three physics prompts cannot establish general-domain performance.
- A teacher must review all results before instructional use.
