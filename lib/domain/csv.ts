import Papa from "papaparse";

import type {
  AnonymousSubmission,
  StudentRecord,
} from "@/lib/domain/types";

interface RawStudentRow {
  student_id?: string;
  student_name?: string;
  response?: string;
}

export interface CsvParseResult {
  records: StudentRecord[];
  errors: string[];
}

const EXPECTED_HEADERS = ["student_id", "student_name", "response"] as const;

export function parseStudentCsv(csvText: string): CsvParseResult {
  if (new Blob([csvText]).size > 100_000) {
    return {
      records: [],
      errors: ["CSV files must be 100 KB or smaller."],
    };
  }

  const parsed = Papa.parse<RawStudentRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const fields = parsed.meta.fields ?? [];
  const missingHeaders = EXPECTED_HEADERS.filter(
    (header) => !fields.includes(header),
  );
  const errors = parsed.errors.map(
    (error) => `Row ${(error.row ?? 0) + 2}: ${error.message}`,
  );

  if (missingHeaders.length > 0) {
    errors.unshift(
      `Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}`,
    );
  }

  if (parsed.data.length > 20) {
    errors.push("This demo supports up to 20 student responses at a time.");
  }

  const records: StudentRecord[] = [];
  const seen = new Set<string>();

  parsed.data.slice(0, 20).forEach((row, index) => {
    const rowNumber = index + 2;
    const studentId = row.student_id?.trim() ?? "";
    const studentName = row.student_name?.trim() ?? "";
    const response = row.response?.trim() ?? "";

    if (!studentId) {
      errors.push(`Row ${rowNumber}: student_id is required.`);
    }
    if (!studentName) {
      errors.push(`Row ${rowNumber}: student_name is required.`);
    }
    if (!response) {
      errors.push(`Row ${rowNumber}: response is required.`);
    }
    if (studentId.length > 64) {
      errors.push(`Row ${rowNumber}: student_id exceeds 64 characters.`);
    }
    if (response.length > 1000) {
      errors.push(`Row ${rowNumber}: response exceeds 1,000 characters.`);
    }

    const normalizedId = studentId.toLowerCase();
    if (studentId && seen.has(normalizedId)) {
      errors.push(`Row ${rowNumber}: duplicate student_id "${studentId}".`);
    }
    if (studentId) {
      seen.add(normalizedId);
    }

    if (studentId && studentName && response && response.length <= 1000) {
      records.push({ studentId, studentName, response });
    }
  });

  return {
    records: errors.length === 0 ? records : [],
    errors: [...new Set(errors)],
  };
}

export function anonymizeRecords(
  records: StudentRecord[],
): AnonymousSubmission[] {
  return records.map(({ studentId, response }) => ({ studentId, response }));
}

export function serializeCsvCell(
  value: string | number | boolean,
): string {
  const raw = String(value);
  const spreadsheetSafe =
    typeof value === "string" && /^(?:\s*[=+\-@]|\t|\r)/.test(raw)
      ? `'${raw}`
      : raw;
  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}

export function recordsToCsv(records: StudentRecord[]): string {
  return Papa.unparse(
    records.map(({ studentId, studentName, response }) => ({
      student_id: studentId,
      student_name: studentName,
      response,
    })),
  );
}
