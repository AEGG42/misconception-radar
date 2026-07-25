export type TemplateId = "collision" | "book-at-rest" | "elevator";

export type Confidence = "high" | "medium" | "low";

export type ProviderKind =
  | "deterministic"
  | "deepseek"
  | "openai"
  | "sample-snapshot";

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  points: number;
}

export interface MisconceptionDefinition {
  id: string;
  shortLabel: string;
  label: string;
  description: string;
  color: string;
  reteachMove: string;
}

export interface AssignmentTemplate {
  id: TemplateId;
  eyebrow: string;
  title: string;
  question: string;
  referenceAnswer: string;
  teacherNote: string;
  rubric: RubricCriterion[];
  misconceptions: MisconceptionDefinition[];
}

export interface StudentRecord {
  studentId: string;
  studentName: string;
  response: string;
}

export interface AnonymousSubmission {
  studentId: string;
  response: string;
}

export interface RubricBreakdown {
  criterionId: string;
  label: string;
  earned: number;
  max: number;
  reason: string;
}

export interface StudentAnalysis {
  studentId: string;
  primaryMisconceptionId: string | null;
  secondaryMisconceptionIds: string[];
  rubricScore: number;
  rubricBreakdown: RubricBreakdown[];
  evidenceQuotes: string[];
  confidence: Confidence;
  needsReview: boolean;
  feedbackDraft: string;
  probingQuestion: string;
}

export interface MisconceptionCount {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  count: number;
  studentIds: string[];
}

export interface ClassSummary {
  averageScore: number;
  masteryRate: number;
  needsReviewCount: number;
  topMisconceptionId: string | null;
  misconceptionCounts: MisconceptionCount[];
}

export interface AnalysisMetadata {
  provider: ProviderKind;
  model: string;
  durationMs: number;
  requestId: string;
  isSampleSnapshot: boolean;
}

export interface AnalysisResponse {
  students: StudentAnalysis[];
  summary: ClassSummary;
  metadata: AnalysisMetadata;
}

export interface ReteachStep {
  minute: string;
  title: string;
  teacherMove: string;
  studentMove: string;
}

export interface ReteachPlan {
  misconceptionId: string;
  objective: string;
  openingLine: string;
  steps: ReteachStep[];
  exitTicket: string;
  answerKey: string;
  lookFor: string;
  metadata: AnalysisMetadata;
}

export interface AnalysisProvider {
  readonly kind: ProviderKind;
  readonly model: string;
  analyze(
    template: AssignmentTemplate,
    submissions: AnonymousSubmission[],
  ): Promise<StudentAnalysis[]>;
  generateReteach(
    template: AssignmentTemplate,
    misconception: MisconceptionDefinition,
    representativeResponses: string[],
  ): Promise<Omit<ReteachPlan, "metadata">>;
}
