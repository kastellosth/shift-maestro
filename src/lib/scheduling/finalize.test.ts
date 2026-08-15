import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildFinalizeSchedulePayload,
} from "./finalize";

import type {
  Employee,
  PinnedAssignment,
  ScheduleGroup,
} from "../../types";

function employee(
  id: string,
  name: string,
  surname: string
): Employee {
  return {
    id,
    name,
    surname,
    company: 1,
    score: 0,

    esso: null,
    essoEntryDate: null,
    iClass: null,
    armed: false,
    notes: null,
  };
}

const employees: Employee[] = [
  employee("e1", "ONE", "TEST"),
  employee("e2", "TWO", "TEST"),
];

const schedule: ScheduleGroup[] = [
  {
    shiftGroup: {
      id: "A",
      name: "A",
      label: "Shift A",
      difficulty: 2,
    },

    rows: [
      {
        job: {
          id: "guard-id",
          key: "guard",
          label: "Guard",
          difficulty: 8,
          requiredPeople: 2,
        },

        shiftGroup: {
          id: "A",
          name: "A",
          label: "Shift A",
          difficulty: 2,
        },

        people: [
          "TEST ONE",
          "TEST TWO",
        ],

        workload: 10,
      },
    ],
  },
];

describe(
  "buildFinalizeSchedulePayload",
  () => {
    it("converts schedule names into employee IDs", () => {
      const payload =
        buildFinalizeSchedulePayload(
          schedule,
          employees,
          {},
          new Date(
            "2026-08-14T00:00:00.000Z"
          )
        );

      expect(payload.date).toBe(
        "2026-08-14T00:00:00.000Z"
      );

      expect(
        payload.assignments
      ).toHaveLength(1);

      expect(
        payload.assignments[0]
          .members
      ).toEqual([
        {
          employeeId: "e1",
          pinned: false,
        },
        {
          employeeId: "e2",
          pinned: false,
        },
      ]);
    });

    it("preserves whether an employee was pinned to that slot", () => {
      const pins: Record<
        string,
        PinnedAssignment
      > = {
        e1: {
          jobKey: "guard",
          shiftId: "A",
        },
      };

      const payload =
        buildFinalizeSchedulePayload(
          schedule,
          employees,
          pins,
          new Date(
            "2026-08-14T00:00:00.000Z"
          )
        );

      expect(
        payload.assignments[0]
          .members
      ).toEqual([
        {
          employeeId: "e1",
          pinned: true,
        },
        {
          employeeId: "e2",
          pinned: false,
        },
      ]);
    });

    it("rejects an incomplete schedule row", () => {
      const incomplete: ScheduleGroup[] =
        [
          {
            ...schedule[0],

            rows: [
              {
                ...schedule[0].rows[0],
                people: ["TEST ONE"],
              },
            ],
          },
        ];

      expect(() =>
        buildFinalizeSchedulePayload(
          incomplete,
          employees,
          {},
          new Date()
        )
      ).toThrow(
        /requires 2 employee/
      );
    });

    it("rejects a scheduled name that cannot be resolved", () => {
      const invalid: ScheduleGroup[] = [
        {
          ...schedule[0],

          rows: [
            {
              ...schedule[0].rows[0],

              people: [
                "TEST ONE",
                "UNKNOWN PERSON",
              ],
            },
          ],
        },
      ];

      expect(() =>
        buildFinalizeSchedulePayload(
          invalid,
          employees,
          {},
          new Date()
        )
      ).toThrow(
        /employee not found/i
      );
    });

    it("rejects duplicate employee names that are ambiguous", () => {
      const duplicateEmployees = [
        ...employees,
        employee(
          "e3",
          "ONE",
          "TEST"
        ),
      ];

      expect(() =>
        buildFinalizeSchedulePayload(
          schedule,
          duplicateEmployees,
          {},
          new Date()
        )
      ).toThrow(/ambiguous/i);
    });
  }
);