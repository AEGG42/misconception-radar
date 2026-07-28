import type {
  BuiltInTemplateId,
  StudentRecord,
} from "@/lib/domain/types";

export const demoClasses: Record<BuiltInTemplateId, StudentRecord[]> = {
  collision: [
    {
      studentId: "S-01",
      studentName: "Maya",
      response:
        "The truck exerts more force because it has much more mass than the car.",
    },
    {
      studentId: "S-02",
      studentName: "Leo",
      response:
        "They exert equal forces in opposite directions on each other. The smaller car accelerates more because it has less mass.",
    },
    {
      studentId: "S-03",
      studentName: "Aisha",
      response:
        "The car applies the action force first, and then the truck pushes back with the reaction force.",
    },
    {
      studentId: "S-04",
      studentName: "Noah",
      response:
        "The forces are equal and opposite, so they cancel each other and neither vehicle should accelerate.",
    },
    {
      studentId: "S-05",
      studentName: "Sofia",
      response:
        "The truck exerts more force because its larger mass makes it hit harder.",
    },
    {
      studentId: "S-06",
      studentName: "Eli",
      response:
        "The forces have equal magnitude and opposite direction at the same instant. They act on different vehicles; the car's smaller mass gives it a larger acceleration.",
    },
    {
      studentId: "S-07",
      studentName: "Priya",
      response:
        "The truck exerts more force because it is heavier, although Newton's third law says the forces might be equal.",
    },
    {
      studentId: "S-08",
      studentName: "Jordan",
      response:
        "Only the moving car exerts a force when it hits. The parked truck does not push until it starts moving.",
    },
  ],
  "book-at-rest": [
    {
      studentId: "B-01",
      studentName: "Amir",
      response: "No forces act because the book is not moving.",
    },
    {
      studentId: "B-02",
      studentName: "Grace",
      response:
        "Gravity pulls down and the table pushes up with an equal normal force, so the net force is zero.",
    },
    {
      studentId: "B-03",
      studentName: "Mateo",
      response:
        "The table's normal force is the reaction force to the book's weight.",
    },
    {
      studentId: "B-04",
      studentName: "Hana",
      response:
        "Gravity is the only force, but the book does not move because it is solid.",
    },
    {
      studentId: "B-05",
      studentName: "Zoe",
      response:
        "The table pushes upward harder than gravity so it can keep the book up.",
    },
  ],
  elevator: [
    {
      studentId: "E-01",
      studentName: "Owen",
      response:
        "The tension is greater because the elevator is moving upward.",
    },
    {
      studentId: "E-02",
      studentName: "Lina",
      response:
        "Tension equals weight. Constant speed means acceleration and net force are zero.",
    },
    {
      studentId: "E-03",
      studentName: "Sam",
      response: "There are no forces because it is not accelerating.",
    },
    {
      studentId: "E-04",
      studentName: "Inez",
      response:
        "The elevator has upward acceleration whenever it has an upward speed.",
    },
    {
      studentId: "E-05",
      studentName: "Kai",
      response:
        "Tension pulls it upward, and weight no longer matters once it is moving.",
    },
  ],
};

export function getDemoClass(
  templateId: BuiltInTemplateId,
): StudentRecord[] {
  return demoClasses[templateId].map((student) => ({ ...student }));
}
