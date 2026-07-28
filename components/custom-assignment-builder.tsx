"use client";

import { Check, PencilLine } from "lucide-react";

import { customTemplateIsComplete } from "@/lib/domain/custom-template";
import type { AssignmentTemplate } from "@/lib/domain/types";

const fieldClass =
  "focus-ring mt-1.5 w-full rounded-xl border border-[#d2d0c7] bg-white px-3 py-2.5 text-sm text-[#26312e] placeholder:text-[#9a9f9b]";

export function CustomAssignmentBuilder({
  template,
  onChange,
}: {
  template: AssignmentTemplate;
  onChange: (template: AssignmentTemplate) => void;
}) {
  const complete = customTemplateIsComplete(template);

  function updateRoot(
    field: "title" | "question" | "referenceAnswer",
    value: string,
  ) {
    onChange({ ...template, [field]: value });
  }

  function updateCriterion(index: number, value: string) {
    onChange({
      ...template,
      rubric: template.rubric.map((criterion, criterionIndex) =>
        criterionIndex === index
          ? { ...criterion, label: value, description: value }
          : criterion,
      ),
    });
  }

  function updateMisconception(index: number, value: string) {
    onChange({
      ...template,
      misconceptions: template.misconceptions.map(
        (misconception, misconceptionIndex) =>
          misconceptionIndex === index
            ? {
                ...misconception,
                shortLabel: value.slice(0, 48),
                label: value,
                description: value,
              }
            : misconception,
      ),
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#cfcfc5] bg-[#f4f1e9] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6a736f]">
            <PencilLine className="size-3.5" />
            Build your exit ticket
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#66706d]">
            Define the expected reasoning and likely incorrect ideas so the
            analysis stays bounded and reviewable.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
            complete
              ? "border-[#b8dcae] bg-[#e8f5e4] text-[#397044]"
              : "border-[#e1c89f] bg-[#fff0dc] text-[#8a5a18]"
          }`}
        >
          {complete ? "Ready" : "Draft"}
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="text-[11px] font-bold text-[#4f5956]">
          Assignment title
          <input
            value={template.title}
            onChange={(event) => updateRoot("title", event.target.value)}
            maxLength={120}
            placeholder="e.g. Energy on a roller coaster"
            className={fieldClass}
          />
        </label>

        <label className="text-[11px] font-bold text-[#4f5956]">
          Question
          <textarea
            value={template.question}
            onChange={(event) =>
              updateRoot("question", event.target.value)
            }
            maxLength={1200}
            rows={3}
            placeholder="Ask a short-answer physics question that requires an explanation."
            className={`${fieldClass} resize-y`}
          />
        </label>

        <label className="text-[11px] font-bold text-[#4f5956]">
          Reference answer
          <textarea
            value={template.referenceAnswer}
            onChange={(event) =>
              updateRoot("referenceAnswer", event.target.value)
            }
            maxLength={1600}
            rows={3}
            placeholder="Write the complete reasoning students should demonstrate."
            className={`${fieldClass} resize-y`}
          />
        </label>
      </div>

      <div className="mt-5 border-t border-[#dad7cd] pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#606a67]">
              Four rubric look-fors
            </p>
            <p className="mt-1 text-[11px] text-[#737b78]">
              Each look-for is worth one point.
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-[#65706d]">
            4 points
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {template.rubric.map((criterion, index) => (
            <label
              key={criterion.id}
              className="rounded-xl border border-[#d9d6cc] bg-white/55 p-3 text-[10px] font-bold text-[#68716e]"
            >
              Look-for {index + 1}
              <input
                value={criterion.label}
                onChange={(event) =>
                  updateCriterion(index, event.target.value)
                }
                maxLength={120}
                placeholder="e.g. Identifies both energy stores"
                className={`${fieldClass} !mt-1 !py-2 text-xs`}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-[#dad7cd] pt-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#606a67]">
          Three common incorrect ideas
        </p>
        <p className="mt-1 text-[11px] text-[#737b78]">
          Use concise statements that could plausibly appear in a student
          response.
        </p>
        <div className="mt-3 grid gap-2">
          {template.misconceptions.map((misconception, index) => (
            <label
              key={misconception.id}
              className="grid items-center gap-2 rounded-xl border border-[#d9d6cc] bg-white/55 p-3 text-[10px] font-bold text-[#68716e] sm:grid-cols-[28px_1fr]"
            >
              <span
                className="grid size-7 place-items-center rounded-full text-[10px] font-extrabold text-white"
                style={{ backgroundColor: misconception.color }}
              >
                {index + 1}
              </span>
              <input
                value={misconception.label}
                onChange={(event) =>
                  updateMisconception(index, event.target.value)
                }
                maxLength={180}
                placeholder="e.g. Energy is used up and disappears"
                aria-label={`Common incorrect idea ${index + 1}`}
                className={`${fieldClass} !mt-0 !py-2 text-xs`}
              />
            </label>
          ))}
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold ${
          complete
            ? "bg-[#e8f5e4] text-[#397044]"
            : "bg-[#fff8e9] text-[#806026]"
        }`}
      >
        <Check className="size-3.5 shrink-0" />
        {complete
          ? "Custom assignment is complete. Add responses when you are ready."
          : "Complete every field before analyzing a class."}
      </div>
    </div>
  );
}
