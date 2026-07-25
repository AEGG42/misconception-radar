# Devpost submission copy

## Project name

Misconception Radar

## Tagline

Turn short answers into evidence-backed misconception clusters and a targeted reteach plan.

## Links

- Application: <https://misconception-radar-july-ai-2026.aegg42.chatgpt.site>
- Source code: **add public GitHub URL before submission**
- Demo video: **add embeddable video URL before submission**

## Inspiration

Teachers do not need another dashboard that only says who was right or wrong. After an exit ticket, the useful question is: **what idea is causing these answers, and what should I do in the next five minutes of instruction?**

Recurring physics misconceptions are especially revealing. A student may know Newton's third law by name yet still believe a heavier truck exerts more force on a car, that action happens before reaction, or that equal and opposite forces cancel even when they act on different objects. We built Misconception Radar to make those ideas visible while there is still time to respond.

## What it does

Misconception Radar turns a class set of short-answer physics responses into:

- a visual map of the class's primary misconceptions;
- exact response evidence behind each diagnostic draft;
- a four-point, rubric-grounded score draft;
- editable individual feedback and a Socratic probing question;
- teacher-review flags for mixed or ambiguous reasoning;
- a targeted five-minute reteach plan and a new exit ticket.

Teachers can load a synthetic demo class or upload a CSV with up to 20 students. Names never leave the browser. The teacher reviews every draft, and nothing is automatically sent to students.

## How we built it

The application is a single Next.js 16 and TypeScript project. Papa Parse validates the CSV in the browser, then removes names before sending anonymous IDs and responses to the server.

All diagnostic providers implement one `AnalysisProvider` contract. The judged build runs a DeepSeek V4 Flash adapter using JSON Output, while a transparent rule-grounded provider supports local development and an alternate OpenAI Responses API adapter demonstrates portability. Every provider must return the same Zod-validated schema.

We do not trust generated aggregates. The server checks every ID, misconception enum, rubric criterion, and evidence quote. It deterministically derives each total score from the validated criterion breakdown, then independently computes class counts, mastery, and review totals. Evidence must be an exact substring of the student's answer or the result is rejected.

The dashboard is built with React, Tailwind CSS, and Recharts. Vitest covers the domain and API contracts, while Playwright covers the complete teacher flow.

## Challenges we ran into

The hardest product decision was resisting breadth. A generic “AI teacher assistant” is easy to describe and difficult to trust. We narrowed the MVP to three forces-and-motion exit tickets and encoded bounded, teacher-reviewed misconception taxonomies for each.

The second challenge was making generated feedback inspectable. We solved that by treating the model as a draft generator, requiring exact evidence, recomputing all statistics in code, and marking uncertain cases for human review.

Finally, we designed a demo that remains honest during provider outages. The fixed synthetic sample snapshot is a separate, explicit action and is clearly labeled as non-live.

During live qualification, we also found that the model could return a total score that disagreed with its own criterion-level points. Rather than spending another model call on a redundant number, we made the validated criterion breakdown the single score source and recompute the total in application code.

## Accomplishments that we're proud of

- A complete classroom loop from CSV to actionable reteach plan.
- Student names are never sent to the server.
- Every feedback draft is tied to exact evidence from the original response.
- Thirty human-labeled synthetic evaluation cases cover three assignments and five misconception patterns per assignment.
- DeepSeek V4 Flash passed three complete qualification runs with 100% primary-misconception match, 96.67% of draft scores within one point, and 100% structural/evidence integrity on the synthetic set.
- The same typed contract supports a deterministic baseline and an authorized structured-output model without changing the UI.
- Production build, lint, strict TypeScript, domain tests, API contract tests, and end-to-end browser tests are included.

## What we learned

The most useful role for AI in formative assessment is not replacing teacher judgment. It is compressing evidence into a reviewable pattern quickly enough for the teacher to act.

We also learned that reliability is a product feature. Bounded labels, structured outputs, exact quotes, deterministic aggregation, visible provider state, and honest fallbacks make the system easier to understand and challenge.

## What's next

Next we would co-design additional misconception taxonomies with classroom teachers, calibrate confidence against larger human-labeled datasets, and support teacher-authored rubrics after the bounded templates meet their accuracy targets. LMS import and export would follow only after privacy and retention controls are validated.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Zod, Papa Parse, Recharts, Vitest, Playwright, DeepSeek API, OpenAI-compatible SDK

## Submission checklist

- [x] Add public application URL
- [ ] Add public GitHub URL
- [ ] Upload `public/devpost-thumbnail.png` as the 3:2 thumbnail
- [x] Prepare dashboard, student-feedback, and reteach screenshots
- [ ] Upload the three prepared screenshots to Devpost
- [ ] Add final YouTube/Vimeo/Youku URL with embedding enabled
- [ ] Confirm video runtime is below 2:00
- [ ] Submit before 2026-07-30 23:45 EDT
