import { describe, expect, it } from "vitest";

import {
  parseAssignmentHistory,
  type ApiAssignmentHistory,
} from "./history";

describe("parseAssignmentHistory", () => {
  it("converts API date strings into Date objects", () => {
    const raw: ApiAssignmentHistory = {
      e1: [
        {
          assignmentId: "a1",
          date: "2026-08-08T00:00:00.000Z",

          job: {
            id: "guard-id",
            key: "guard",
            label: "Guard",
            difficulty: 8,
            requiredPeople: 2,
          },

          shiftGroup: {
            id: "B",
            name: "B",
            label: "Shift B",
            difficulty: 4,
          },
        },
      ],
    };

    const parsed =
      parseAssignmentHistory(raw);

    expect(parsed.e1).toHaveLength(1);

    expect(
      parsed.e1[0].date
    ).toBeInstanceOf(Date);

    expect(
      parsed.e1[0].date.toISOString()
    ).toBe(
      "2026-08-08T00:00:00.000Z"
    );

    expect(
      parsed.e1[0].job.difficulty
    ).toBe(8);

    expect(
      parsed.e1[0].shiftGroup.difficulty
    ).toBe(4);
  });

  it("preserves empty employee history", () => {
    const raw: ApiAssignmentHistory = {
      e1: [],
    };

    const parsed =
      parseAssignmentHistory(raw);

    expect(parsed.e1).toEqual([]);
  });
});