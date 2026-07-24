import type {
  AssignmentTemplate,
  MisconceptionDefinition,
  TemplateId,
} from "@/lib/domain/types";

const palette = {
  coral: "#f26b4f",
  amber: "#e6a23c",
  violet: "#8c6de9",
  blue: "#4e89e8",
  teal: "#2f9e8f",
  rose: "#cf5f7c",
};

const misconception = (
  definition: MisconceptionDefinition,
): MisconceptionDefinition => definition;

export const templates: Record<TemplateId, AssignmentTemplate> = {
  collision: {
    id: "collision",
    eyebrow: "Newton's third law",
    title: "Car–truck collision",
    question:
      "A small car collides head-on with a much heavier truck. During the collision, which vehicle exerts the greater force on the other? Explain your reasoning.",
    referenceAnswer:
      "The car and truck exert forces of equal magnitude in opposite directions on each other at the same time. The forces act on different objects, so they do not cancel. The car can have a larger acceleration because its mass is smaller.",
    teacherNote:
      "This exit ticket separates force-pair reasoning from mass and acceleration reasoning.",
    rubric: [
      {
        id: "magnitude",
        label: "Equal magnitude",
        description: "States that each vehicle exerts an equal-magnitude force.",
        points: 1,
      },
      {
        id: "direction",
        label: "Opposite directions",
        description: "States that the interaction forces point in opposite directions.",
        points: 1,
      },
      {
        id: "objects",
        label: "Different objects",
        description: "Recognizes that the two forces act on different objects.",
        points: 1,
      },
      {
        id: "acceleration",
        label: "Mass vs. acceleration",
        description: "Separates equal force from unequal acceleration.",
        points: 1,
      },
    ],
    misconceptions: [
      misconception({
        id: "heavier-more-force",
        shortLabel: "Heavier = more force",
        label: "The heavier object exerts the greater force",
        description:
          "Mass is incorrectly used to decide the size of an interaction force.",
        color: palette.coral,
        reteachMove:
          "Separate the equal interaction force pair from each object's acceleration using F = ma.",
      }),
      misconception({
        id: "motion-more-force",
        shortLabel: "Motion = more force",
        label: "The faster or moving object exerts more force",
        description:
          "Speed or motion is treated as the cause of a larger third-law force.",
        color: palette.amber,
        reteachMove:
          "Use two force sensors to show that speed changes the time profile, not equality of the pair.",
      }),
      misconception({
        id: "action-before-reaction",
        shortLabel: "Action comes first",
        label: "The action happens before the reaction",
        description:
          "The paired forces are seen as a time sequence rather than one interaction.",
        color: palette.violet,
        reteachMove:
          "Draw both forces on the same interaction timeline and emphasize simultaneous contact.",
      }),
      misconception({
        id: "third-law-forces-cancel",
        shortLabel: "Forces cancel",
        label: "Third-law forces cancel each other",
        description:
          "Equal and opposite forces on different objects are added as if they act on one object.",
        color: palette.blue,
        reteachMove:
          "Place each force on a separate free-body diagram before discussing net force.",
      }),
      misconception({
        id: "one-sided-interaction",
        shortLabel: "One-sided force",
        label: "Only one object exerts a force",
        description:
          "The collision is described as a one-way push rather than a mutual interaction.",
        color: palette.rose,
        reteachMove:
          "Ask students to identify what deforms each object during the same instant of contact.",
      }),
    ],
  },
  "book-at-rest": {
    id: "book-at-rest",
    eyebrow: "Balanced forces",
    title: "Book on a table",
    question:
      "A book is resting on a level table. Identify the forces acting on the book and explain why it remains at rest.",
    referenceAnswer:
      "Gravity pulls the book downward while the table's normal force pushes upward with equal magnitude. These forces act on the same object and balance, so the net force and acceleration are zero. They are not a Newton's third-law pair.",
    teacherNote:
      "This prompt tests equilibrium, contact forces, and the difference between balanced forces and third-law pairs.",
    rubric: [
      {
        id: "gravity",
        label: "Gravity identified",
        description: "Identifies Earth's downward gravitational force.",
        points: 1,
      },
      {
        id: "normal",
        label: "Normal force identified",
        description: "Identifies the table's upward normal force.",
        points: 1,
      },
      {
        id: "balance",
        label: "Net force is zero",
        description: "Explains that equal forces give zero net force.",
        points: 1,
      },
      {
        id: "pair",
        label: "Pair distinction",
        description: "Does not call weight and normal force a third-law pair.",
        points: 1,
      },
    ],
    misconceptions: [
      misconception({
        id: "no-motion-no-force",
        shortLabel: "At rest = no forces",
        label: "An object at rest has no forces acting on it",
        description:
          "Zero velocity is confused with the absence of forces rather than zero net force.",
        color: palette.coral,
        reteachMove:
          "Contrast force arrows with the net-force sum on a stationary object.",
      }),
      misconception({
        id: "normal-is-reaction",
        shortLabel: "Normal reacts to weight",
        label: "The normal force is the reaction to the book's weight",
        description:
          "Two balanced forces on the book are mistaken for a third-law pair.",
        color: palette.violet,
        reteachMove:
          "Name the source and target of each force and locate the actual partners on Earth and table.",
      }),
      misconception({
        id: "gravity-only",
        shortLabel: "Gravity only",
        label: "Only gravity acts on the resting book",
        description:
          "The table's contact force is omitted.",
        color: palette.amber,
        reteachMove:
          "Ask what prevents the book from accelerating through the table.",
      }),
      misconception({
        id: "support-greater",
        shortLabel: "Support is greater",
        label: "The table's force must be greater to hold the book up",
        description:
          "Equilibrium is described using an upward force larger than weight.",
        color: palette.blue,
        reteachMove:
          "Use a force sum and connect nonzero net force to acceleration.",
      }),
      misconception({
        id: "force-keeps-rest",
        shortLabel: "Force keeps it still",
        label: "A continuous net force is required to keep an object at rest",
        description:
          "A net force is treated as necessary to maintain a constant state of motion.",
        color: palette.teal,
        reteachMove:
          "Reconnect the situation to Newton's first law and zero acceleration.",
      }),
    ],
  },
  elevator: {
    id: "elevator",
    eyebrow: "Velocity vs. acceleration",
    title: "Elevator at constant speed",
    question:
      "An elevator is moving upward at a constant speed. Compare the upward cable tension with the elevator's weight and explain your answer.",
    referenceAnswer:
      "The upward tension equals the downward weight. Constant velocity means zero acceleration, so the net force is zero even though the elevator is moving upward.",
    teacherNote:
      "This exit ticket reveals whether students use velocity or acceleration to reason about net force.",
    rubric: [
      {
        id: "tension",
        label: "Tension identified",
        description: "Identifies the upward cable tension.",
        points: 1,
      },
      {
        id: "weight",
        label: "Weight identified",
        description: "Identifies the downward gravitational force.",
        points: 1,
      },
      {
        id: "equal",
        label: "Forces are equal",
        description: "States that tension and weight have equal magnitude.",
        points: 1,
      },
      {
        id: "acceleration",
        label: "Zero acceleration",
        description: "Connects constant velocity to zero acceleration and net force.",
        points: 1,
      },
    ],
    misconceptions: [
      misconception({
        id: "moving-up-net-force-up",
        shortLabel: "Moving up = net up",
        label: "Upward motion requires a larger upward force",
        description:
          "The direction of velocity is incorrectly used as the direction of net force.",
        color: palette.coral,
        reteachMove:
          "Compare upward motion while speeding up, moving steadily, and slowing down.",
      }),
      misconception({
        id: "constant-speed-has-acceleration",
        shortLabel: "Speed means acceleration",
        label: "Any moving object has acceleration",
        description:
          "Nonzero velocity is confused with nonzero acceleration.",
        color: palette.violet,
        reteachMove:
          "Use equal-time position dots to distinguish velocity from change in velocity.",
      }),
      misconception({
        id: "no-acceleration-no-force",
        shortLabel: "No a = no forces",
        label: "Zero acceleration means no forces act",
        description:
          "Balanced forces are replaced by an absence of forces.",
        color: palette.amber,
        reteachMove:
          "Draw both real forces before taking their vector sum.",
      }),
      misconception({
        id: "weight-disappears",
        shortLabel: "No weight in motion",
        label: "Weight disappears while the elevator moves",
        description:
          "Gravity is omitted because the elevator is supported or moving.",
        color: palette.blue,
        reteachMove:
          "Track the gravitational interaction across rest and motion cases.",
      }),
      misconception({
        id: "tension-equals-motion",
        shortLabel: "Tension causes motion",
        label: "Tension alone explains continued upward motion",
        description:
          "A single force is used to explain motion without considering the net force.",
        color: palette.teal,
        reteachMove:
          "Use a force sum to separate what changes motion from what motion already exists.",
      }),
    ],
  },
};

export const templateList = Object.values(templates);

export function getTemplate(id: TemplateId): AssignmentTemplate {
  return templates[id];
}
