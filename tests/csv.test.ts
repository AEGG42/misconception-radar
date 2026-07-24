import { describe, expect, it } from "vitest";

import {
  anonymizeRecords,
  parseStudentCsv,
  recordsToCsv,
} from "@/lib/domain/csv";

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
});
