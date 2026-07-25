# Two-minute demo video

Target runtime: **1:54**

Format: 1920×1080, 16:9, English narration, burned-in captions

Recording state: collision template, eight-person synthetic class, browser at 100% zoom, live DeepSeek badge visible

Demo story lock: Maya, Sofia, and Priya share the **Heavier = more force**
signal; Maya is the default evidence detail.

Measured synthetic-class capture on 2026-07-25: **23.1 s analysis** and
**7.5 s reteach generation**. If this take is used, show those actual timings
in the edited wait captions.

## Final narration and shot list

| Time | Picture | Narration |
| --- | --- | --- |
| 0:00–0:09 | Cold open on eight paper exit tickets, then title card | “Twenty exit tickets. Ten minutes before the next class. Who got it wrong is easy. What does the class actually misunderstand?” |
| 0:09–0:20 | Landing page; cursor highlights the tagline | “Misconception Radar turns short physics answers into an evidence-backed misconception map and a targeted reteach plan.” |
| 0:20–0:33 | Select the car–truck collision prompt and click **Load demo class** | “I choose a bounded Newton's third-law prompt and load eight synthetic responses. Names stay in this browser; only anonymous IDs and answers are analyzed.” |
| 0:33–0:40 | Click **Analyze class**; cut the wait cleanly | “Structured DeepSeek analysis compares each explanation with a teacher-reviewed rubric and misconception taxonomy.” |
| 0:40–0:58 | Results hero and four metric cards; settle on chart | “Now I can see the class pattern: mastery, draft scores, review flags, and the most common underlying ideas—not just right and wrong.” |
| 0:58–1:13 | Click **Heavier = more force** in the map | “Three students are using mass to decide the size of an interaction force. The count is recomputed in code from student-level results.” |
| 1:13–1:31 | Open Maya's detail, show original response, exact quote, rubric, edit feedback, approve | “For Maya, the diagnosis is tied to her exact words. I can inspect the rubric, edit the feedback draft, and approve it. Nothing is sent automatically.” |
| 1:31–1:44 | Click **Generate 5-minute plan**, reveal steps and exit ticket | “One click turns the class's top signal into a five-minute teaching move, a force-diagram task, and a new exit ticket.” |
| 1:44–1:51 | Use `public/video-architecture-overlay.svg` | “Bounded expert labels. Structured DeepSeek output. Deterministic evidence checks. Names stay in the browser.” |
| 1:51–1:54 | End card with logo, tagline, `misconception-radar-july-ai-2026.aegg42.chatgpt.site`, and the public repository URL | “Misconception Radar: see the idea beneath the answer.” |

## Edit rules

- Record one successful complete run before editing.
- Cut out inference wait; add a small caption with the measured completion time.
- Keep the cursor still while the narrator explains a result.
- Use no more than two zooms, both on evidence that is unreadable at full frame.
- Keep the provider badge visible whenever a result screen appears.
- If using the fixed sample snapshot, keep its warning banner visible and say “sample snapshot.”
- Normalize voice to approximately −14 LUFS; keep music at least 18 dB below narration.
- Export at 30 fps, H.264, and verify the uploaded embed in a logged-out browser.
- Reject any final cut at or above 1:58 to preserve platform and encoding margin.

## Capture checklist

- [ ] Clear browser notifications and personal bookmarks
- [ ] Use synthetic names only
- [ ] Set operating-system scale so UI text is crisp
- [ ] Preload the app once to avoid cold asset loading
- [x] Capture dashboard screenshot at 1920×1080
- [x] Capture student-feedback screenshot at 1920×1080
- [x] Capture reteach-plan screenshot at 1920×1080
- [x] Lock the deployed application URL in the end-card template
- [ ] Replace the public GitHub placeholder before recording
- [ ] Upload as unlisted/public with embedding enabled

## Draft recording assets

- Architecture overlay: `public/video-architecture-overlay.svg`
- End-card template: `public/video-end-card-template.svg`
- The end card intentionally keeps one obvious GitHub placeholder. Do not use
  it in the final export until the public repository exists.
