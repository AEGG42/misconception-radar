import type {
  AnalysisProvider,
  AnonymousSubmission,
  AssignmentTemplate,
  Confidence,
  MisconceptionDefinition,
  ReteachPlan,
  RubricBreakdown,
  StudentAnalysis,
} from "@/lib/domain/types";

type PatternRule = {
  id: string;
  patterns: RegExp[];
};

interface Assessment {
  primaryMisconceptionId: string | null;
  secondaryMisconceptionIds: string[];
  criteriaMet: boolean[];
  confidence: Confidence;
}

const misconceptionPatterns: Record<string, PatternRule[]> = {
  collision: [
    {
      id: "heavier-more-force",
      patterns: [
        /\b(truck|heavier|more mass)\b.{0,45}\b(more|greater|larger|harder)\b.{0,18}\bforce/i,
        /\bmore force\b.{0,35}\b(heavier|mass|truck)\b/i,
      ],
    },
    {
      id: "motion-more-force",
      patterns: [
        /\b(faster|speed|moving|momentum)\b.{0,48}\b(more|greater|larger|harder)\b.{0,20}\b(force|hit)/i,
        /\bgreater force\b.{0,30}\b(faster|moving)/i,
      ],
    },
    {
      id: "action-before-reaction",
      patterns: [
        /\b(first|then|after|before)\b.{0,55}\b(action|reaction|push)/i,
        /\baction\b.{0,35}\bthen\b.{0,30}\breaction\b/i,
      ],
    },
    {
      id: "third-law-forces-cancel",
      patterns: [
        /\b(equal|opposite|forces?)\b.{0,55}\b(cancel|neither|no acceleration)/i,
        /\bcancel each other\b/i,
      ],
    },
    {
      id: "one-sided-interaction",
      patterns: [
        /\b(only|does not|doesn't|no)\b.{0,35}\b(exert|push|force)/i,
        /\bone[- ]way\b/i,
      ],
    },
  ],
  "book-at-rest": [
    {
      id: "no-motion-no-force",
      patterns: [
        /\b(no forces?|nothing)\b.{0,35}\b(rest|not moving|still)/i,
        /\b(rest|not moving|still)\b.{0,35}\b(no forces?|nothing)/i,
      ],
    },
    {
      id: "normal-is-reaction",
      patterns: [
        /\b(normal|table)\b.{0,45}\b(reaction|third law)\b.{0,35}\b(weight|gravity)/i,
        /\breaction\b.{0,35}\b(normal|table)/i,
      ],
    },
    {
      id: "gravity-only",
      patterns: [
        /\b(only|just)\b.{0,25}\b(gravity|weight)\b/i,
        /\bgravity is the only force\b/i,
      ],
    },
    {
      id: "support-greater",
      patterns: [
        /\b(table|normal|support)\b.{0,45}\b(greater|larger|harder|more)\b/i,
        /\bgreater\b.{0,35}\b(gravity|weight)\b/i,
      ],
    },
    {
      id: "force-keeps-rest",
      patterns: [
        /\b(force|push)\b.{0,35}\b(keep|keeps|hold|holds)\b.{0,30}\b(still|rest)/i,
      ],
    },
  ],
  elevator: [
    {
      id: "moving-up-net-force-up",
      patterns: [
        /\b(tension|upward force)\b.{0,45}\b(greater|larger|more)\b.{0,45}\b(moving|upward|going up)/i,
        /\b(moving|going)\b.{0,25}\bup\b.{0,40}\b(tension|force)\b.{0,25}\b(greater|more)/i,
      ],
    },
    {
      id: "constant-speed-has-acceleration",
      patterns: [
        /\b(speed|moving|velocity)\b.{0,45}\b(acceleration|accelerating)\b/i,
        /\bupward acceleration\b.{0,35}\b(upward speed|moving upward)/i,
      ],
    },
    {
      id: "no-acceleration-no-force",
      patterns: [
        /\b(no|zero)\b.{0,25}\b(acceleration)\b.{0,35}\b(no|zero)\b.{0,15}\bforces?/i,
        /\bno forces?\b.{0,45}\b(not accelerating|zero acceleration)/i,
      ],
    },
    {
      id: "weight-disappears",
      patterns: [
        /\b(weight|gravity)\b.{0,35}\b(no longer|disappear|does not matter|doesn't matter|none)/i,
        /\bno (weight|gravity)\b/i,
      ],
    },
    {
      id: "tension-equals-motion",
      patterns: [
        /\btension\b.{0,45}\b(causes|keeps|makes)\b.{0,35}\b(motion|moving|upward)/i,
      ],
    },
  ],
};

const probingQuestions: Record<string, string> = {
  "heavier-more-force":
    "If the truck's force were larger, how could the two contact forces still form one Newton's third-law pair?",
  "motion-more-force":
    "Does Newton's third law compare speeds, or does it describe the two forces within one interaction?",
  "action-before-reaction":
    "At what instant could the car push on the truck without the truck being in contact with the car?",
  "third-law-forces-cancel":
    "Which object does each force act on, and can forces on different objects be added in one free-body diagram?",
  "one-sided-interaction":
    "What interaction changes the shape or motion of the object you said does not push back?",
  "no-motion-no-force":
    "Can two nonzero forces add to zero even while both still act on the book?",
  "normal-is-reaction":
    "Do the book's weight and the table's normal force act on the same object or on different objects?",
  "gravity-only":
    "What prevents the book from accelerating downward through the table?",
  "support-greater":
    "What acceleration would result if the upward force were actually larger than the downward force?",
  "force-keeps-rest":
    "What does Newton's first law predict when the net force is zero?",
  "moving-up-net-force-up":
    "Could an object move upward while slowing down, and which way would its acceleration point then?",
  "constant-speed-has-acceleration":
    "What must change for acceleration to be nonzero: velocity itself or velocity over time?",
  "no-acceleration-no-force":
    "Can gravity and tension both act while their vector sum is zero?",
  "weight-disappears":
    "Does Earth's gravitational interaction stop when the elevator begins moving?",
  "tension-equals-motion":
    "Which force sum changes motion, and what happens when tension exactly equals weight?",
};

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function collisionCriteria(text: string): boolean[] {
  const equal =
    /\b(equal|same)\b.{0,28}\b(force|magnitude|size)\b/i.test(text) ||
    /\bforces?\b.{0,20}\b(equal|same)\b/i.test(text);
  const opposite = /\bopposite\b/i.test(text);
  const differentObjects =
    /\b(different|separate)\b.{0,25}\b(objects?|vehicles?)\b/i.test(text) ||
    /\bon each other\b/i.test(text);
  const acceleration =
    /\bacceleration\b/i.test(text) &&
    /\b(mass|lighter|smaller|less)\b/i.test(text);
  return [equal, opposite, differentObjects, acceleration];
}

function bookCriteria(text: string): boolean[] {
  const gravity = /\b(gravity|weight|gravitational)\b/i.test(text);
  const normal = /\b(normal|table pushes|support force)\b/i.test(text);
  const balance =
    /\b(net force|resultant)\b.{0,28}\b(zero|0)\b/i.test(text) ||
    /\b(equal|balance|balanced)\b/i.test(text);
  const pairDistinction =
    /\b(not|isn't|are not)\b.{0,35}\b(third[- ]law|action[- ]reaction|pair)\b/i.test(
      text,
    );
  return [gravity, normal, balance, pairDistinction];
}

function elevatorCriteria(text: string): boolean[] {
  const tension = /\b(tension|cable|upward force)\b/i.test(text);
  const weight = /\b(weight|gravity|gravitational)\b/i.test(text);
  const equal =
    /\b(equal|same|balanced)\b/i.test(text) ||
    /\bnet force\b.{0,20}\b(zero|0)\b/i.test(text);
  const acceleration =
    /\b(constant speed|constant velocity)\b/i.test(text) &&
    (/\b(zero|no)\b.{0,20}\b(acceleration|net force)\b/i.test(text) ||
      /\b(acceleration|net force)\b.{0,20}\b(zero|0)\b/i.test(text));
  return [tension, weight, equal, acceleration];
}

function criteriaFor(templateId: string, text: string): boolean[] {
  if (templateId === "collision") {
    return collisionCriteria(text);
  }
  if (templateId === "book-at-rest") {
    return bookCriteria(text);
  }
  return elevatorCriteria(text);
}

function findMisconceptions(
  template: AssignmentTemplate,
  response: string,
): string[] {
  const rules = misconceptionPatterns[template.id] ?? [];
  return rules
    .filter((rule) => rule.patterns.some((pattern) => has(response, pattern)))
    .map((rule) => rule.id);
}

function assess(
  template: AssignmentTemplate,
  response: string,
): Assessment {
  const misconceptions = findMisconceptions(template, response);
  const criteriaMet = criteriaFor(template.id, response);
  const metCount = criteriaMet.filter(Boolean).length;
  const hasMixedReasoning = misconceptions.length > 0 && metCount > 0;

  let confidence: Confidence = "high";
  if (misconceptions.length === 0 && metCount < 2) {
    confidence = "low";
  } else if (hasMixedReasoning || misconceptions.length > 1) {
    confidence = "medium";
  }

  return {
    primaryMisconceptionId: misconceptions[0] ?? null,
    secondaryMisconceptionIds: misconceptions.slice(1, 4),
    criteriaMet,
    confidence,
  };
}

function exactEvidence(response: string, assessment: Assessment): string[] {
  const matchingId = assessment.primaryMisconceptionId;
  if (matchingId) {
    const rule = Object.values(misconceptionPatterns)
      .flat()
      .find((candidate) => candidate.id === matchingId);
    const sentence = response
      .split(/(?<=[.!?])\s+/)
      .find((candidate) =>
        rule?.patterns.some((pattern) => pattern.test(candidate)),
      );
    if (sentence) {
      return [sentence.slice(0, 260)];
    }
  }
  return [response.slice(0, 260)];
}

function buildRubricBreakdown(
  template: AssignmentTemplate,
  criteriaMet: boolean[],
): RubricBreakdown[] {
  return template.rubric.map((criterion, index) => ({
    criterionId: criterion.id,
    label: criterion.label,
    earned: criteriaMet[index] ? 1 : 0,
    max: 1,
    reason: criteriaMet[index]
      ? `The response includes evidence of ${criterion.description.toLowerCase()}`
      : `The response does not yet show ${criterion.description.toLowerCase()}`,
  }));
}

function feedbackFor(
  template: AssignmentTemplate,
  assessment: Assessment,
  score: number,
): string {
  const misconception = template.misconceptions.find(
    (item) => item.id === assessment.primaryMisconceptionId,
  );

  if (!misconception && score >= 3) {
    return `Strong reasoning: you connected the key forces to the object's motion. To make the explanation fully transferable, name the object each force acts on and state the net-force conclusion explicitly.`;
  }
  if (misconception) {
    return `You named an important feature of the situation, but your explanation suggests: “${misconception.shortLabel}.” Revisit which object each force acts on and use the net force—not motion alone—to justify your conclusion.`;
  }
  return `Your response identifies part of the situation, but it needs a clearer force comparison. Draw a free-body diagram, name the source and target of each force, and connect the net force to acceleration.`;
}

function probingQuestionFor(
  template: AssignmentTemplate,
  assessment: Assessment,
): string {
  if (assessment.primaryMisconceptionId) {
    return (
      probingQuestions[assessment.primaryMisconceptionId] ??
      "Which object does each force act on, and what does their vector sum predict?"
    );
  }
  return template.id === "collision"
    ? "Why can equal forces produce different accelerations for the car and truck?"
    : "How would your conclusion change if the object began accelerating?";
}

function analyzeOne(
  template: AssignmentTemplate,
  submission: AnonymousSubmission,
): StudentAnalysis {
  const assessment = assess(template, submission.response);
  const breakdown = buildRubricBreakdown(
    template,
    assessment.criteriaMet,
  );
  const rubricScore = breakdown.reduce(
    (total, criterion) => total + criterion.earned,
    0,
  );
  const needsReview =
    assessment.confidence !== "high" ||
    rubricScore === 2 ||
    (assessment.primaryMisconceptionId === null && rubricScore < 3);

  return {
    studentId: submission.studentId,
    primaryMisconceptionId: assessment.primaryMisconceptionId,
    secondaryMisconceptionIds: assessment.secondaryMisconceptionIds,
    rubricScore,
    rubricBreakdown: breakdown,
    evidenceQuotes: exactEvidence(submission.response, assessment),
    confidence: assessment.confidence,
    needsReview,
    feedbackDraft: feedbackFor(template, assessment, rubricScore),
    probingQuestion: probingQuestionFor(template, assessment),
  };
}

function createReteachPlan(
  template: AssignmentTemplate,
  misconception: MisconceptionDefinition,
): Omit<ReteachPlan, "metadata"> {
  return {
    misconceptionId: misconception.id,
    objective: `Students will replace “${misconception.shortLabel}” with a force-based explanation grounded in objects, interactions, and net force.`,
    openingLine: `“Several explanations used the idea that ${misconception.label.toLowerCase()}. Let's test that idea against one force diagram.”`,
    steps: [
      {
        minute: "0:00–1:00",
        title: "Surface the idea",
        teacherMove:
          "Display one anonymous response and ask students to underline the claim about force.",
        studentMove:
          "Quietly identify the claim and predict whether the evidence supports it.",
      },
      {
        minute: "1:00–3:30",
        title: "Rebuild the model",
        teacherMove: misconception.reteachMove,
        studentMove:
          "Draw or revise a force diagram, labeling the source and target of every force.",
      },
      {
        minute: "3:30–5:00",
        title: "Commit to a new explanation",
        teacherMove:
          "Ask for a one-sentence claim that uses net force and acceleration correctly.",
        studentMove:
          "Write, compare with a partner, and revise the sentence once.",
      },
    ],
    exitTicket: `Return to this prompt: “${template.question}” Give a two-sentence answer: one sentence about the forces and one about the resulting motion.`,
    answerKey: template.referenceAnswer,
    lookFor:
      "Look for correctly named force sources and targets, an explicit net-force statement, and no reliance on motion alone.",
  };
}

export class DeterministicAnalysisProvider implements AnalysisProvider {
  readonly kind = "deterministic" as const;
  readonly model = "rule-grounded-demo-v1";

  async analyze(
    template: AssignmentTemplate,
    submissions: AnonymousSubmission[],
  ): Promise<StudentAnalysis[]> {
    return submissions.map((submission) => analyzeOne(template, submission));
  }

  async generateReteach(
    template: AssignmentTemplate,
    misconception: MisconceptionDefinition,
    representativeResponses: string[],
  ): Promise<Omit<ReteachPlan, "metadata">> {
    void representativeResponses;
    return createReteachPlan(template, misconception);
  }
}
