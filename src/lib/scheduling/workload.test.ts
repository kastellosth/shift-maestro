// src/lib/scheduling/workload.test.ts

import { describe, expect, it } from "vitest";
import { calculateAssignmentWorkload } from "./workload";

describe("calculateAssignmentWorkload", () => {
  it("adds job difficulty and shift difficulty", () => {
    const job = {
      id: "job-1",
      key: "guard",
      label: "Guard",
      difficulty: 8,
      requiredPeople: 2,
    };

    const shift = {
      id: "shift-b",
      name: "B",
      label: "Night",
      difficulty: 4,
    };

    expect(
      calculateAssignmentWorkload(job, shift)
    ).toBe(12);
  });
});