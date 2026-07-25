import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  anonymizeRecords,
  parseStudentCsv,
  recordsToCsv,
  serializeCsvCell,
} from "@/lib/domain/csv";
import { getDemoClass } from "@/lib/domain/demo-data";

describe("student CSV parsing", () => {
  it("parses the required columns and strips names from server payloads", () => {
    const result = parseStudentCsv(
      [
        "student_id,student_name,response",
        'S-01,Maya,"They exert equal and opposite forces."',
        'S-02,Leo,"The truck pushes harder."',
      ].join("\n"),
    );

    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(anonymizeRecords(result.records)).toEqual([
      {
        studentId: "S-01",
        response: "They exert equal and opposite forces.",
      },
      {
        studentId: "S-02",
        response: "The truck pushes harder.",
      },
    ]);
    expect(JSON.stringify(anonymizeRecords(result.records))).not.toContain(
      "Maya",
    );
  });

  it("rejects duplicate IDs case-insensitively", () => {
    const result = parseStudentCsv(
      [
        "student_id,student_name,response",
        "S-01,Maya,First response",
        "s-01,Leo,Second response",
      ].join("\n"),
    );

    expect(result.records).toEqual([]);
    expect(result.errors.join(" ")).toContain("duplicate student_id");
  });

  it("reports missing headers without accepting partial data", () => {
    const result = parseStudentCsv(
      ["student_id,name,answer", "S-01,Maya,An answer"].join("\n"),
    );

    expect(result.records).toEqual([]);
    expect(result.errors.join(" ")).toContain(
      "student_name, response",
    );
  });

  it("round-trips records through the expected CSV field names", () => {
    const original = [
      {
        studentId: "S-01",
        studentName: "Maya",
        response: 'A response with a comma, and "quotes".',
      },
    ];

    const result = parseStudentCsv(recordsToCsv(original));

    expect(result.errors).toEqual([]);
    expect(result.records).toEqual(original);
  });

  it("neutralizes spreadsheet formulas in exported cells", () => {
    expect(serializeCsvCell("=HYPERLINK(\"https://example.com\")")).toBe(
      "\"'=HYPERLINK(\"\"https://example.com\"\")\"",
    );
    expect(serializeCsvCell("  +SUM(1,1)")).toBe(
      "\"'  +SUM(1,1)\"",
    );
    expect(serializeCsvCell("Maya")).toBe("\"Maya\"");
  });

  it("keeps the downloadable sample CSV aligned with the demo story", () => {
    const sampleCsv = readFileSync(
      path.resolve("public/sample-class.csv"),
      "utf8",
    );

    expect(parseStudentCsv(sampleCsv).records).toEqual(
      getDemoClass("collision"),
    );
  });
});
