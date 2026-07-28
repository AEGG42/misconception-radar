import type { AssignmentTemplate } from "@/lib/domain/types";

const customPalette = [
  "#f26b4f",
  "#e6a23c",
  "#8c6de9",
] as const;

export function createEmptyCustomTemplate(): AssignmentTemplate {
  return {
    id: "custom",
    eyebrow: "Custom physics prompt",
    title: "",
    question: "",
    referenceAnswer: "",
    teacherNote:
      "Teacher-created exit ticket. Review all automated signals before use.",
    rubric: Array.from({ length: 4 }, (_, index) => ({
      id: `custom-criterion-${index + 1}`,
      label: "",
      description: "",
      points: 1,
    })),
    misconceptions: Array.from({ length: 3 }, (_, index) => ({
      id: `custom-misconception-${index + 1}`,
      shortLabel: "",
      label: "",
      description: "",
      color: customPalette[index],
      reteachMove:
        "Contrast the incorrect idea with the reference model, then ask students to revise their explanation using evidence.",
    })),
  };
}

export function customTemplateIsComplete(
  template: AssignmentTemplate,
): boolean {
  return Boolean(
    template.title.trim() &&
      template.question.trim() &&
      template.referenceAnswer.trim() &&
      template.rubric.length === 4 &&
      template.rubric.every(
        (criterion) =>
          criterion.label.trim() && criterion.description.trim(),
      ) &&
      template.misconceptions.length === 3 &&
      template.misconceptions.every(
        (misconception) =>
          misconception.shortLabel.trim() &&
          misconception.label.trim() &&
          misconception.description.trim(),
      ),
  );
}
