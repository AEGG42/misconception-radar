"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Radar,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  anonymizeRecords,
  parseStudentCsv,
  serializeCsvCell,
} from "@/lib/domain/csv";
import { getDemoClass } from "@/lib/domain/demo-data";
import {
  representativeResponsesFor,
} from "@/lib/domain/analysis";
import { templateList, templates } from "@/lib/domain/templates";
import type {
  AnalysisResponse,
  ReteachPlan,
  StudentAnalysis,
  StudentRecord,
  TemplateId,
} from "@/lib/domain/types";

type AppStep = "setup" | "results";

interface ApiErrorPayload {
  error?: string;
  details?: string[];
  requestId?: string;
}

const engineLabels = {
  deterministic: {
    label: "Rule-grounded demo",
    tone: "bg-[#e9f5f2] text-[#1e7569] border-[#bfe2db]",
  },
  deepseek: {
    label: "Live DeepSeek AI",
    tone: "bg-[#e8efff] text-[#274c8e] border-[#c3d4f5]",
  },
  openai: {
    label: "Live structured AI",
    tone: "bg-[#ecf6cf] text-[#506716] border-[#d2e79d]",
  },
  "sample-snapshot": {
    label: "Sample snapshot",
    tone: "bg-[#fff0dc] text-[#8a5a18] border-[#efd5ac]",
  },
} as const;

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-10 place-items-center overflow-hidden rounded-full border border-[#14201f] bg-[#d7fa62]">
        <span className="absolute size-7 rounded-full border border-[#14201f]/25" />
        <span className="absolute size-4 rounded-full border border-[#14201f]/30" />
        <Radar className="size-5" strokeWidth={1.8} />
      </div>
      {!compact && (
        <div>
          <p className="text-[15px] font-extrabold tracking-[-0.02em]">
            Misconception Radar
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#65706d]">
            Formative insight, faster
          </p>
        </div>
      )}
    </div>
  );
}

function TopNavigation({ step }: { step: AppStep }) {
  return (
    <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 md:px-10">
      <LogoMark />
      <div className="hidden items-center gap-2 text-xs font-semibold text-[#5c6663] md:flex">
        <span
          className={`rounded-full px-3 py-1.5 ${
            step === "setup" ? "bg-[#14201f] text-white" : "bg-white/70"
          }`}
        >
          01 · Class responses
        </span>
        <ChevronRight className="size-3.5" />
        <span
          className={`rounded-full px-3 py-1.5 ${
            step === "results" ? "bg-[#14201f] text-white" : "bg-white/70"
          }`}
        >
          02 · Diagnostic map
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-[#d6d4cb] bg-white/65 px-3 py-2 text-xs font-semibold text-[#46504e] backdrop-blur">
        <ShieldCheck className="size-4 text-[#2f9e8f]" />
        <span className="hidden sm:inline">Names stay in your browser</span>
        <span className="sm:hidden">Private</span>
      </div>
    </header>
  );
}

function AssignmentPicker({
  selectedId,
  onSelect,
}: {
  selectedId: TemplateId;
  onSelect: (id: TemplateId) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {templateList.map((template, index) => {
        const selected = template.id === selectedId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            aria-pressed={selected}
            className={`focus-ring group rounded-2xl border p-3 text-left transition-all ${
              selected
                ? "border-[#14201f] bg-[#14201f] text-white shadow-lg"
                : "border-[#d9d7ce] bg-[#fffdf7] hover:-translate-y-0.5 hover:border-[#9c9e94]"
            }`}
          >
            <span
              className={`mb-3 grid size-7 place-items-center rounded-full text-[11px] font-extrabold ${
                selected
                  ? "bg-[#d7fa62] text-[#14201f]"
                  : "bg-[#eeece4] text-[#5d6765]"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-65">
              {template.eyebrow}
            </span>
            <span className="mt-1 block text-sm font-bold leading-tight">
              {template.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14201f]/70 px-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#fffdf7] p-7 text-center shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-[#e8e5dc]">
          <div className="scan-line h-full w-1/3 bg-[#d7fa62]" />
        </div>
        <div className="relative mx-auto mb-5 grid size-20 place-items-center rounded-full border border-[#ccd0c4] bg-[#eef4db]">
          <span className="radar-pulse absolute size-14 rounded-full border border-[#6d8a24]/50" />
          <span className="radar-pulse absolute size-9 rounded-full border border-[#6d8a24]/60 [animation-delay:200ms]" />
          <Radar className="size-8 text-[#526c16]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a736f]">
          Mapping classroom thinking
        </p>
        <h2 className="display-type mt-2 text-3xl">Looking for the idea beneath the answer.</h2>
        <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5f6865]">
          <span className="rounded-lg bg-[#f0eee7] px-2 py-2">Rubric</span>
          <span className="rounded-lg bg-[#f0eee7] px-2 py-2">Evidence</span>
          <span className="rounded-lg bg-[#f0eee7] px-2 py-2">Patterns</span>
        </div>
      </div>
    </div>
  );
}

function SetupWorkspace({
  templateId,
  records,
  csvErrors,
  onTemplateChange,
  onLoadDemo,
  onFileChange,
  onRemoveRecord,
  onAnalyze,
  onUseSnapshot,
  isAnalyzing,
}: {
  templateId: TemplateId;
  records: StudentRecord[];
  csvErrors: string[];
  onTemplateChange: (id: TemplateId) => void;
  onLoadDemo: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveRecord: (studentId: string) => void;
  onAnalyze: () => void;
  onUseSnapshot: () => void;
  isAnalyzing: boolean;
}) {
  const template = templates[templateId];
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="paper-grid min-h-[calc(100vh-88px)] border-t border-[#d9d7ce]/80 px-5 pb-16 pt-10 md:px-10">
      {isAnalyzing && <LoadingOverlay />}
      <div className="mx-auto max-w-[1320px]">
        <section className="lift-in mb-10 grid items-end gap-8 lg:grid-cols-[1fr_440px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ccd0c4] bg-[#fffdf7]/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#52615d]">
              <FlaskConical className="size-3.5 text-[#2f9e8f]" />
              Physics exit-ticket diagnostic
            </div>
            <h1 className="display-type max-w-4xl text-[clamp(3.2rem,7vw,6.8rem)] leading-[0.86]">
              See what your class
              <span className="relative ml-3 inline-block italic">
                actually
                <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-[#d7fa62] opacity-80 -z-10" />
              </span>
              <br />
              misunderstands.
            </h1>
          </div>
          <div className="border-l-2 border-[#14201f] pl-5">
            <p className="text-lg leading-relaxed text-[#46504e]">
              Turn a stack of short answers into an evidence-backed
              misconception map and a five-minute reteach plan.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-[#5c6663]">
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> Up to 20 responses
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="size-4" /> Human-reviewed
              </span>
              <span className="flex items-center gap-1.5">
                <LockKeyhole className="size-4" /> No student storage
              </span>
            </div>
          </div>
        </section>

        <section className="lift-in-delay grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="card-shadow rounded-[28px] border border-[#d9d7ce] bg-[#fffdf7] p-5 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6b7572]">
                  Step 01
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.025em]">
                  Choose an exit ticket
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-[#edf2df]">
                <BookOpen className="size-5 text-[#526c16]" />
              </div>
            </div>

            <AssignmentPicker
              selectedId={templateId}
              onSelect={onTemplateChange}
            />

            <div className="mt-5 rounded-2xl border border-[#d9d7ce] bg-[#f4f1e9] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6a736f]">
                  Prompt
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#65706d]">
                  4-point rubric
                </span>
              </div>
              <p className="mt-3 text-[16px] font-semibold leading-relaxed">
                {template.question}
              </p>
              <details className="mt-4 border-t border-[#dad7cd] pt-4">
                <summary className="focus-ring cursor-pointer text-xs font-bold text-[#52615d]">
                  View reference answer & rubric
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#58625f]">
                  {template.referenceAnswer}
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {template.rubric.map((criterion) => (
                    <li
                      key={criterion.id}
                      className="flex items-center gap-2 text-xs font-semibold text-[#47514e]"
                    >
                      <Check className="size-3.5 text-[#2f9e8f]" />
                      {criterion.label}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>

          <div className="card-shadow rounded-[28px] border border-[#d9d7ce] bg-[#fffdf7] p-5 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6b7572]">
                  Step 02
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.025em]">
                  Add class responses
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-[#fce8e1]">
                <Users className="size-5 text-[#ad4b38]" />
              </div>
            </div>

            {records.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onLoadDemo}
                  className="focus-ring group rounded-2xl border border-[#14201f] bg-[#14201f] p-5 text-left text-white transition-transform hover:-translate-y-0.5"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-full bg-[#d7fa62] text-[#14201f]">
                      <Sparkles className="size-5" />
                    </span>
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="font-extrabold">Load demo class</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">
                    Synthetic answers that cover correct, mixed, and common
                    misconception patterns.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="focus-ring group rounded-2xl border border-dashed border-[#a8aba2] bg-[#f4f1e9] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#14201f]"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-full border border-[#d5d2c8] bg-white text-[#3e4c48]">
                      <UploadCloud className="size-5" />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#67716e]">
                      CSV · 100 KB max
                    </span>
                  </div>
                  <p className="font-extrabold">Upload responses</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#69726f]">
                    Required columns: student_id, student_name, response.
                  </p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileChange}
                  className="sr-only"
                  aria-label="Upload student response CSV"
                />
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-[#d7fa62] text-xs font-extrabold">
                      {records.length}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">Responses ready</p>
                      <p className="text-[11px] text-[#69726f]">
                        Names stay local; anonymous IDs are analyzed.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="focus-ring rounded-full border border-[#d6d3c9] px-3 py-1.5 text-[11px] font-bold hover:bg-[#f1efe8]"
                  >
                    Replace CSV
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onFileChange}
                    className="sr-only"
                    aria-label="Replace student response CSV"
                  />
                </div>
                <div className="max-h-[300px] overflow-auto rounded-2xl border border-[#dad7cd]">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#efede5] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#64706c]">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Response preview</th>
                        <th className="w-10 px-2 py-3">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr
                          key={record.studentId}
                          className="border-t border-[#e2dfd6] bg-white/65"
                        >
                          <td className="whitespace-nowrap px-4 py-3 align-top">
                            <p className="text-xs font-extrabold">
                              {record.studentName}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#77807d]">
                              {record.studentId}
                            </p>
                          </td>
                          <td className="max-w-[310px] px-4 py-3 text-xs leading-relaxed text-[#55605d]">
                            {record.response}
                          </td>
                          <td className="px-2 py-3 align-top">
                            <button
                              type="button"
                              onClick={() =>
                                onRemoveRecord(record.studentId)
                              }
                              className="focus-ring grid size-7 place-items-center rounded-full text-[#7a827f] hover:bg-[#f7e4df] hover:text-[#ad4b38]"
                              aria-label={`Remove ${record.studentName}`}
                            >
                              <X className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {csvErrors.length > 0 && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-[#efc9bf] bg-[#fff0eb] p-4 text-xs text-[#8b3e2e]"
              >
                <div className="mb-2 flex items-center gap-2 font-extrabold">
                  <AlertTriangle className="size-4" />
                  Check the CSV
                </div>
                <ul className="space-y-1 pl-6">
                  {csvErrors.map((error) => (
                    <li key={error} className="list-disc">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-[#bfe2db] bg-[#eaf6f2] p-3.5">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#2f9e8f]" />
                <p className="text-[11px] leading-relaxed text-[#42645d]">
                  <strong>Privacy by construction.</strong> Student names are
                  joined back to results only in this browser. Responses are
                  never stored by Misconception Radar.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onAnalyze}
                disabled={records.length === 0 || isAnalyzing}
                className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-full bg-[#14201f] px-5 py-3.5 text-sm font-extrabold text-white transition-all hover:bg-[#253331] disabled:bg-[#b4b8b1]"
              >
                {isAnalyzing ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <BrainCircuit className="size-4" />
                )}
                Analyze class
                <ArrowRight className="size-4" />
              </button>
              {templateId === "collision" && (
                <button
                  type="button"
                  onClick={onUseSnapshot}
                  disabled={isAnalyzing}
                  className="focus-ring rounded-full border border-[#c7c6be] px-5 py-3.5 text-xs font-extrabold text-[#4e5956] hover:bg-[#f0eee7]"
                >
                  Use sample snapshot
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#75807c]">
          <span>Evidence, not labels</span>
          <span className="size-1 rounded-full bg-[#9da39e]" />
          <span>Drafts, not final grades</span>
          <span className="size-1 rounded-full bg-[#9da39e]" />
          <span>Teacher stays in control</span>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = "plain",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: "plain" | "acid" | "coral";
}) {
  const tones = {
    plain: "bg-[#fffdf7]",
    acid: "bg-[#d7fa62]",
    coral: "bg-[#f8ddd5]",
  };
  return (
    <div
      className={`soft-shadow rounded-2xl border border-[#d5d3c9] p-5 ${tones[accent]}`}
    >
      <div className="mb-4 flex items-center justify-between text-[#53605c]">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em]">
          {label}
        </p>
        {icon}
      </div>
      <p className="display-type text-4xl leading-none">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#59635f]">
        {detail}
      </p>
    </div>
  );
}

function StudentDetail({
  student,
  analysis,
  templateId,
  feedback,
  approved,
  onFeedbackChange,
  onApprove,
}: {
  student: StudentRecord;
  analysis: StudentAnalysis;
  templateId: TemplateId;
  feedback: string;
  approved: boolean;
  onFeedbackChange: (value: string) => void;
  onApprove: () => void;
}) {
  const template = templates[templateId];
  const misconception = template.misconceptions.find(
    (item) => item.id === analysis.primaryMisconceptionId,
  );

  return (
    <aside className="rounded-[24px] border border-[#d7d5cc] bg-[#fffdf7] p-5 lg:sticky lg:top-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-[#14201f] text-sm font-extrabold text-white">
            {student.studentName
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold">{student.studentName}</h3>
            <p className="text-[11px] text-[#707a77]">
              {student.studentId} · Draft score {analysis.rubricScore}/4
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
            analysis.needsReview
              ? "bg-[#fff0dc] text-[#895717]"
              : "bg-[#e5f4e7] text-[#3f7348]"
          }`}
        >
          {analysis.needsReview ? "Review" : "High confidence"}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-[#f1efe8] p-4">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#737b78]">
          Original response
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#3f4946]">
          “{student.response}”
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#737b78]">
          Diagnostic signal
        </p>
        {misconception ? (
          <div className="mt-2 flex items-start gap-3 rounded-2xl border border-[#e0d4cd] bg-[#fff8f4] p-3.5">
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: misconception.color }}
            />
            <div>
              <p className="text-xs font-extrabold">{misconception.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#68716e]">
                Evidence: “{analysis.evidenceQuotes[0]}”
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-[#eaf6f2] p-3 text-xs font-bold text-[#2f7469]">
            <CheckCircle2 className="size-4" />
            No primary misconception detected
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#737b78]">
            Rubric evidence
          </p>
          <span className="text-[10px] font-bold text-[#69726f]">
            {analysis.rubricScore} of 4
          </span>
        </div>
        <div className="space-y-2">
          {analysis.rubricBreakdown.map((item) => (
            <div
              key={item.criterionId}
              className="flex items-center justify-between gap-3 text-[11px]"
              title={item.reason}
            >
              <span className="text-[#525d59]">{item.label}</span>
              <span
                className={`grid size-5 place-items-center rounded-full ${
                  item.earned
                    ? "bg-[#d7fa62] text-[#31430e]"
                    : "bg-[#ebe9e1] text-[#929894]"
                }`}
              >
                {item.earned ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <X className="size-3" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor={`feedback-${student.studentId}`}
          className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#737b78]"
        >
          Feedback draft · editable
        </label>
        <textarea
          id={`feedback-${student.studentId}`}
          value={feedback}
          onChange={(event) => onFeedbackChange(event.target.value)}
          rows={5}
          className="focus-ring mt-2 w-full resize-none rounded-2xl border border-[#d2d0c7] bg-white p-3 text-xs leading-relaxed text-[#3f4946]"
        />
        <div className="mt-2 rounded-xl border-l-2 border-[#8c6de9] bg-[#f4f0ff] px-3 py-2.5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7157bd]">
            Probing question
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#554875]">
            {analysis.probingQuestion}
          </p>
        </div>
        <button
          type="button"
          onClick={onApprove}
          className={`focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-extrabold transition-colors ${
            approved
              ? "bg-[#e1f0c1] text-[#486114]"
              : "bg-[#14201f] text-white hover:bg-[#263432]"
          }`}
        >
          {approved ? (
            <>
              <CheckCircle2 className="size-4" />
              Feedback approved locally
            </>
          ) : (
            <>
              <Check className="size-4" />
              Approve draft
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function ReteachPanel({
  templateId,
  selectedMisconceptionId,
  analysis,
  records,
}: {
  templateId: TemplateId;
  selectedMisconceptionId: string | null;
  analysis: AnalysisResponse;
  records: StudentRecord[];
}) {
  const [plan, setPlan] = useState<ReteachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const template = templates[templateId];
  const misconception = template.misconceptions.find(
    (item) => item.id === selectedMisconceptionId,
  );

  async function generatePlan() {
    if (!misconception) {
      return;
    }
    setLoading(true);
    setError(null);

    const responses = representativeResponsesFor(
      misconception.id,
      analysis.students,
      anonymizeRecords(records),
    );

    try {
      const response = await fetch("/api/reteach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          misconceptionId: misconception.id,
          representativeResponses:
            responses.length > 0 ? responses : [records[0]?.response],
        }),
      });
      const payload = (await response.json()) as ReteachPlan & ApiErrorPayload;
      if (!response.ok) {
        throw new Error(payload.error || "Could not generate the plan.");
      }
      setPlan(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not generate the plan.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!misconception) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#cbc9c0] bg-[#f2efe7] p-7 text-center">
        <CheckCircle2 className="mx-auto size-8 text-[#2f9e8f]" />
        <p className="mt-3 font-extrabold">No class-wide misconception yet</p>
        <p className="mt-1 text-xs text-[#68726f]">
          Select a misconception from the map to build a targeted plan.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#14201f] bg-[#14201f] text-white">
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start md:p-7">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#d7fa62]">
            <Sparkles className="size-3.5" />
            Targeted reteach
          </div>
          <h3 className="display-type text-3xl leading-tight">
            Turn the top signal into tomorrow&apos;s five-minute move.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/62">
            Focus: {misconception.label}. The plan uses anonymous class
            evidence and keeps the teacher as the final editor.
          </p>
        </div>
        {!plan && (
          <button
            type="button"
            onClick={generatePlan}
            disabled={loading}
            className="focus-ring flex items-center justify-center gap-2 rounded-full bg-[#d7fa62] px-5 py-3 text-xs font-extrabold text-[#14201f] hover:bg-[#e4ff8d] disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <BrainCircuit className="size-4" />
            )}
            Generate 5-minute plan
          </button>
        )}
      </div>

      {error && (
        <div className="mx-5 mb-5 rounded-xl border border-[#ffad99]/40 bg-[#5a3027] p-3 text-xs text-[#ffd6cb] md:mx-7">
          {error}
        </div>
      )}

      {plan && (
        <div className="border-t border-white/10 bg-[#fffdf7] p-5 text-[#14201f] md:p-7">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl bg-[#d7fa62] p-5">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#506716]">
                Learning objective
              </p>
              <p className="mt-2 text-sm font-extrabold leading-relaxed">
                {plan.objective}
              </p>
              <div className="mt-5 border-t border-[#91ab36]/35 pt-4">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#506716]">
                  Opening line
                </p>
                <p className="mt-2 text-xs leading-relaxed">
                  {plan.openingLine}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {plan.steps.map((step, index) => (
                <div
                  key={step.minute}
                  className="grid gap-3 rounded-2xl border border-[#ddd9cf] p-4 sm:grid-cols-[90px_1fr]"
                >
                  <div>
                    <p className="text-[10px] font-extrabold text-[#2f9e8f]">
                      {step.minute}
                    </p>
                    <p className="mt-1 text-xs font-extrabold">
                      {String(index + 1).padStart(2, "0")} · {step.title}
                    </p>
                  </div>
                  <div className="grid gap-2 text-[11px] leading-relaxed text-[#59635f] sm:grid-cols-2">
                    <p>
                      <strong className="text-[#26312e]">Teacher:</strong>{" "}
                      {step.teacherMove}
                    </p>
                    <p>
                      <strong className="text-[#26312e]">Students:</strong>{" "}
                      {step.studentMove}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border-l-4 border-[#f26b4f] bg-[#fff0eb] p-4">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#a54c38]">
                Exit ticket
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                {plan.exitTicket}
              </p>
            </div>
            <details className="rounded-2xl border border-[#d9d7ce] bg-white p-4">
              <summary className="focus-ring cursor-pointer text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#52615d]">
                Reveal answer key & look-fors
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-[#4d5854]">
                {plan.answerKey}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6a736f]">
                <strong>Look for:</strong> {plan.lookFor}
              </p>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsDashboard({
  templateId,
  records,
  analysis,
  onReset,
}: {
  templateId: TemplateId;
  records: StudentRecord[];
  analysis: AnalysisResponse;
  onReset: () => void;
}) {
  const template = templates[templateId];
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    const topMisconceptionStudent = analysis.summary.topMisconceptionId
      ? analysis.students.find(
          (item) =>
            item.primaryMisconceptionId ===
            analysis.summary.topMisconceptionId,
        )
      : undefined;
    return (
      topMisconceptionStudent?.studentId ??
      analysis.students.find((item) => item.needsReview)?.studentId ??
      analysis.students[0]?.studentId
    );
  });
  const [selectedMisconceptionId, setSelectedMisconceptionId] = useState(
    analysis.summary.topMisconceptionId,
  );
  const [feedbackEdits, setFeedbackEdits] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        analysis.students.map((item) => [
          item.studentId,
          item.feedbackDraft,
        ]),
      ),
  );
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const recordById = useMemo(
    () => new Map(records.map((record) => [record.studentId, record])),
    [records],
  );
  const analysisById = useMemo(
    () =>
      new Map(
        analysis.students.map((studentAnalysis) => [
          studentAnalysis.studentId,
          studentAnalysis,
        ]),
      ),
    [analysis.students],
  );
  const selectedStudent = recordById.get(selectedStudentId);
  const selectedStudentAnalysis = analysisById.get(selectedStudentId);
  const engine = engineLabels[analysis.metadata.provider];
  const topMisconception = analysis.summary.topMisconceptionId
    ? analysis.summary.misconceptionCounts.find(
        (item) => item.id === analysis.summary.topMisconceptionId,
      )
    : undefined;
  const chartData = analysis.summary.misconceptionCounts.map((item) => ({
    ...item,
    displayLabel:
      item.shortLabel.length > 21
        ? `${item.shortLabel.slice(0, 20)}…`
        : item.shortLabel,
  }));

  function exportFeedback() {
    const headers = [
      "student_id",
      "student_name",
      "draft_score",
      "primary_misconception",
      "needs_review",
      "feedback",
      "probing_question",
      "approved",
    ];
    const rows = analysis.students.map((item) => {
      const record = recordById.get(item.studentId);
      const misconception = template.misconceptions.find(
        (candidate) => candidate.id === item.primaryMisconceptionId,
      );
      return [
        item.studentId,
        record?.studentName ?? "",
        item.rubricScore,
        misconception?.label ?? "No primary misconception",
        item.needsReview,
        feedbackEdits[item.studentId] ?? item.feedbackDraft,
        item.probingQuestion,
        approvedIds.has(item.studentId),
      ]
        .map(serializeCsvCell)
        .join(",");
    });
    const csv = `\uFEFF${[headers.join(","), ...rows].join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `misconception-radar-${templateId}-feedback.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-[calc(100vh-88px)] border-t border-[#d9d7ce] bg-[#f1efe8] px-4 pb-20 pt-5 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        {analysis.metadata.isSampleSnapshot && (
          <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#e8c997] bg-[#fff2dd] px-4 py-3 text-xs text-[#755022] sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <FileText className="size-4" />
              <p>
                <strong>Sample snapshot:</strong> fixed synthetic data is shown
                for reliable demonstration. This is not a live model result.
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="focus-ring rounded-full border border-[#d8b77f] px-3 py-1.5 font-extrabold hover:bg-white/50"
            >
              Return to live demo engine
            </button>
          </div>
        )}

        <section className="lift-in rounded-[28px] border border-[#d5d3ca] bg-[#fffdf7] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${engine.tone}`}
                >
                  {engine.label}
                </span>
                <span className="text-[10px] font-bold text-[#77807d]">
                  {analysis.metadata.model} · {analysis.metadata.durationMs} ms
                </span>
              </div>
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#69736f]">
                {template.eyebrow}
              </p>
              <h1 className="display-type mt-1 max-w-4xl text-4xl leading-tight md:text-5xl">
                Your class is not making one mistake.
                <span className="italic text-[#2f9e8f]">
                  {" "}
                  It&apos;s revealing a pattern.
                </span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#59635f]">
                {template.question}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={exportFeedback}
                className="focus-ring flex items-center gap-2 rounded-full border border-[#cbc9c0] bg-white px-4 py-2.5 text-xs font-extrabold hover:bg-[#f2f0e8]"
              >
                <Download className="size-4" />
                Export feedback
              </button>
              <button
                type="button"
                onClick={onReset}
                className="focus-ring flex items-center gap-2 rounded-full bg-[#14201f] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#283633]"
              >
                <RotateCcw className="size-4" />
                New class
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Class mastery"
              value={`${analysis.summary.masteryRate}%`}
              detail={`${analysis.students.filter((student) => student.rubricScore >= 3).length} of ${analysis.students.length} responses meet 3+ rubric points`}
              icon={<BarChart3 className="size-4" />}
              accent="acid"
            />
            <MetricCard
              label="Average draft score"
              value={`${analysis.summary.averageScore}/4`}
              detail="A formative signal—not a final grade"
              icon={<FlaskConical className="size-4" />}
            />
            <MetricCard
              label="Top misconception"
              value={String(topMisconception?.count ?? 0)}
              detail={topMisconception?.shortLabel ?? "No dominant pattern"}
              icon={<Radar className="size-4" />}
              accent="coral"
            />
            <MetricCard
              label="Teacher review"
              value={String(analysis.summary.needsReviewCount)}
              detail="Mixed or ambiguous responses flagged"
              icon={<Eye className="size-4" />}
            />
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[28px] border border-[#d5d3ca] bg-[#fffdf7] p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#69736f]">
                  Class pattern
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.025em]">
                  Misconception map
                </h2>
              </div>
              <span className="rounded-full bg-[#f0eee7] px-3 py-1.5 text-[10px] font-bold text-[#69736f]">
                Primary signal per student
              </span>
            </div>
            <div className="mt-5 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 22, bottom: 4, left: 4 }}
                >
                  <CartesianGrid
                    stroke="#e4e1d8"
                    horizontal={false}
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    domain={[0, Math.max(4, analysis.students.length)]}
                    tick={{ fill: "#75807c", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="displayLabel"
                    type="category"
                    width={130}
                    tick={{ fill: "#4f5956", fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f2f0e8" }}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #d5d3ca",
                      boxShadow: "0 12px 30px rgba(20,32,31,.10)",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    isAnimationActive={false}
                    radius={[0, 8, 8, 0]}
                    barSize={22}
                    onClick={(entry) => {
                      const payload = entry as unknown as { id?: string };
                      if (payload.id) {
                        setSelectedMisconceptionId(payload.id);
                      }
                    }}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color}
                        opacity={
                          selectedMisconceptionId === entry.id ? 1 : 0.78
                        }
                        stroke={
                          selectedMisconceptionId === entry.id
                            ? "#14201f"
                            : "transparent"
                        }
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {analysis.summary.misconceptionCounts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMisconceptionId(item.id)}
                  aria-pressed={selectedMisconceptionId === item.id}
                  className={`focus-ring flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    selectedMisconceptionId === item.id
                      ? "border-[#14201f] bg-[#f0eee7]"
                      : "border-[#e0ded5] hover:bg-[#f6f4ed]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-[11px] font-bold">
                      {item.shortLabel}
                    </span>
                  </span>
                  <span className="text-xs font-extrabold">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_390px] xl:grid-cols-1">
            <div className="overflow-hidden rounded-[28px] border border-[#d5d3ca] bg-[#fffdf7]">
              <div className="flex items-center justify-between border-b border-[#dedbd2] px-5 py-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#69736f]">
                    Student evidence
                  </p>
                  <h2 className="mt-0.5 text-lg font-extrabold">
                    Review the drafts
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-[#6f7975]">
                  {approvedIds.size}/{analysis.students.length} approved
                </span>
              </div>
              <div className="max-h-[430px] overflow-auto">
                {analysis.students.map((item) => {
                  const record = recordById.get(item.studentId);
                  const misconception = template.misconceptions.find(
                    (candidate) =>
                      candidate.id === item.primaryMisconceptionId,
                  );
                  const selected = selectedStudentId === item.studentId;
                  return (
                    <button
                      key={item.studentId}
                      type="button"
                      onClick={() => setSelectedStudentId(item.studentId)}
                      className={`focus-ring grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-[#e2dfd6] px-5 py-3.5 text-left transition-colors last:border-0 ${
                        selected
                          ? "bg-[#edf2df]"
                          : "hover:bg-[#f7f5ef]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-extrabold">
                            {record?.studentName ?? item.studentId}
                          </p>
                          {approvedIds.has(item.studentId) && (
                            <CheckCircle2 className="size-3.5 text-[#2f9e8f]" />
                          )}
                          {item.needsReview && (
                            <span className="rounded-full bg-[#fff0dc] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-[#8a5a18]">
                              Review
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[10px] text-[#69736f]">
                          {misconception?.shortLabel ??
                            "No primary misconception"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-full bg-white text-[11px] font-extrabold">
                          {item.rubricScore}/4
                        </span>
                        <ChevronRight className="size-3.5 text-[#79827f]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {selectedStudent && selectedStudentAnalysis && (
          <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_400px]">
            <ReteachPanel
              key={selectedMisconceptionId}
              templateId={templateId}
              selectedMisconceptionId={selectedMisconceptionId}
              analysis={analysis}
              records={records}
            />
            <StudentDetail
              student={selectedStudent}
              analysis={selectedStudentAnalysis}
              templateId={templateId}
              feedback={
                feedbackEdits[selectedStudentId] ??
                selectedStudentAnalysis.feedbackDraft
              }
              approved={approvedIds.has(selectedStudentId)}
              onFeedbackChange={(value) =>
                setFeedbackEdits((current) => ({
                  ...current,
                  [selectedStudentId]: value,
                }))
              }
              onApprove={() =>
                setApprovedIds((current) => {
                  const next = new Set(current);
                  if (next.has(selectedStudentId)) {
                    next.delete(selectedStudentId);
                  } else {
                    next.add(selectedStudentId);
                  }
                  return next;
                })
              }
            />
          </section>
        )}

        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-[#d0cec5] pt-5 text-[10px] font-semibold text-[#6f7975] sm:flex-row">
          <p>
            Misconception Radar · Human-reviewed formative assessment
          </p>
          <p>
            No names sent · No responses stored · No feedback auto-delivered
          </p>
        </footer>
      </div>
    </main>
  );
}

export function MisconceptionRadar() {
  const [step, setStep] = useState<AppStep>("setup");
  const [templateId, setTemplateId] =
    useState<TemplateId>("collision");
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  function changeTemplate(nextId: TemplateId) {
    setTemplateId(nextId);
    setRecords([]);
    setCsvErrors([]);
    setAnalysis(null);
    setAppError(null);
  }

  function loadDemo() {
    setRecords(getDemoClass(templateId));
    setCsvErrors([]);
    setAppError(null);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const parsed = parseStudentCsv(await file.text());
    setCsvErrors(parsed.errors);
    if (parsed.errors.length === 0) {
      setRecords(parsed.records);
      setAppError(null);
    }
  }

  async function analyzeClass() {
    if (records.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    setAppError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          submissions: anonymizeRecords(records),
        }),
      });
      const payload = (await response.json()) as AnalysisResponse &
        ApiErrorPayload;
      if (!response.ok) {
        throw new Error(payload.error || "The class could not be analyzed.");
      }
      setAnalysis(payload);
      setStep("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caughtError) {
      setAppError(
        caughtError instanceof Error
          ? caughtError.message
          : "The class could not be analyzed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function useSampleSnapshot() {
    setIsAnalyzing(true);
    setAppError(null);
    try {
      const sampleRecords = getDemoClass("collision");
      const response = await fetch("/api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "collision" }),
      });
      const payload = (await response.json()) as AnalysisResponse &
        ApiErrorPayload;
      if (!response.ok) {
        throw new Error(
          payload.error || "The sample snapshot could not be loaded.",
        );
      }
      setTemplateId("collision");
      setRecords(sampleRecords);
      setAnalysis(payload);
      setStep("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caughtError) {
      setAppError(
        caughtError instanceof Error
          ? caughtError.message
          : "The sample snapshot could not be loaded.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function reset() {
    setStep("setup");
    setAnalysis(null);
    setAppError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="noise min-h-screen">
      <TopNavigation step={step} />
      {appError && (
        <div
          role="alert"
          className="fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,620px)] -translate-x-1/2 items-start justify-between gap-4 rounded-2xl border border-[#efb8aa] bg-[#fff0eb] p-4 text-xs text-[#833927] shadow-2xl"
        >
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-extrabold">Analysis paused</p>
              <p className="mt-1 leading-relaxed">{appError}</p>
              {templateId === "collision" && (
                <button
                  type="button"
                  onClick={useSampleSnapshot}
                  className="focus-ring mt-2 font-extrabold underline underline-offset-2"
                >
                  Use the clearly labeled sample snapshot
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAppError(null)}
            className="focus-ring grid size-7 shrink-0 place-items-center rounded-full hover:bg-[#f8d9d1]"
            aria-label="Dismiss error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {step === "setup" || !analysis ? (
        <SetupWorkspace
          templateId={templateId}
          records={records}
          csvErrors={csvErrors}
          onTemplateChange={changeTemplate}
          onLoadDemo={loadDemo}
          onFileChange={handleFileChange}
          onRemoveRecord={(studentId) =>
            setRecords((current) =>
              current.filter((record) => record.studentId !== studentId),
            )
          }
          onAnalyze={analyzeClass}
          onUseSnapshot={useSampleSnapshot}
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <ResultsDashboard
          templateId={templateId}
          records={records}
          analysis={analysis}
          onReset={reset}
        />
      )}
    </div>
  );
}
