import {
  describe,
  expect,
  it,
} from "vitest";

import {
  rankEmployeesForJob,
  type EmployeeSchedulingContext,
} from "./ranking";

import type {
  Employee,
} from "../../types/employee";

import type {
  Job,
  ShiftGroup,
} from "../../types";

import type {
  HistoricalAssignment,
} from "./fatigue";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function employee(
  id: string,
  name: string
): Employee {
  return {
    id,
    name,
    surname: "TEST",
    company: 2,

    // Transitional DB field.
    // Ranking no longer uses this.
    score: 0,

    esso: null,
    essoEntryDate: null,
    iClass: null,
    armed: false,
    notes: null,
  };
}

const guardJob: Job = {
  id: "guard",
  key: "guard",
  label: "Guard",
  difficulty: 8,
  requiredPeople: 1,
  
};

const nightShift: ShiftGroup = {
  id: "night",
  name: "Night",
  label: "Night",
  difficulty: 4,
 
};

const targetDate =
  new Date(
    "2026-08-09T00:00:00.000Z"
  );

function assignment(
  date: string,
  job: Job = guardJob,
  shift: ShiftGroup = nightShift
): HistoricalAssignment {
  return {
    date: new Date(date),
    job,
    shiftGroup: shift,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("rankEmployeesForJob", () => {
  it("prefers the less fatigued employee", () => {
    const employees:
      EmployeeSchedulingContext[] = [
        {
          employee: employee(
            "john",
            "John"
          ),

          history: [
            assignment(
              "2026-08-08T00:00:00.000Z"
            ),
          ],
        },

        {
          employee: employee(
            "maria",
            "Maria"
          ),

          history: [
            assignment(
              "2026-08-01T00:00:00.000Z"
            ),
          ],
        },
      ];

    const ranked =
      rankEmployeesForJob(
        employees,
        guardJob,
        targetDate
      );

    expect(
      ranked[0].employee.id
    ).toBe("maria");
  });

  it("prefers lower recent workload when fatigue is equal", () => {
    const heavyJob: Job = {
      id: "heavy",
      key: "heavy",
      label: "Heavy Duty",
      difficulty: 6,
      requiredPeople: 1,
      
    };

    const lightJob: Job = {
      id: "light",
      key: "light",
      label: "Light Duty",
      difficulty: 2,
      requiredPeople: 1,
     
    };

    const dayShift: ShiftGroup = {
      id: "day",
      name: "Day",
      label: "Day",
      difficulty: 1,
     
    };

    const employees:
      EmployeeSchedulingContext[] = [
        {
          employee: employee(
            "john",
            "John"
          ),

          history: [
            // Five days ago:
            // fatigue = 0,
            // but still inside 7-day workload window.
            assignment(
              "2026-08-04T00:00:00.000Z",
              heavyJob,
              dayShift
            ),
          ],
        },

        {
          employee: employee(
            "maria",
            "Maria"
          ),

          history: [
            assignment(
              "2026-08-04T00:00:00.000Z",
              lightJob,
              dayShift
            ),
          ],
        },
      ];

    const ranked =
      rankEmployeesForJob(
        employees,
        guardJob,
        targetDate
      );

    expect(
      ranked[0].employee.id
    ).toBe("maria");
  });

  it("prefers fewer repetitions when fatigue and recent workload are equal", () => {
    const employees:
      EmployeeSchedulingContext[] = [
        {
          employee: employee(
            "john",
            "John"
          ),

          history: [
            assignment(
              "2026-07-01T00:00:00.000Z"
            ),
            assignment(
              "2026-07-02T00:00:00.000Z"
            ),
          ],
        },

        {
          employee: employee(
            "maria",
            "Maria"
          ),

          history: [],
        },
      ];

    const ranked =
      rankEmployeesForJob(
        employees,
        guardJob,
        targetDate
      );

    expect(
      ranked[0].employee.id
    ).toBe("maria");
  });

  it("prefers a rested employee even when they have done the job more often", () => {
    const heavyOtherJob: Job = {
      id: "heavy-other",
      key: "heavy-other",
      label: "Heavy Other Duty",
      difficulty: 10,
      requiredPeople: 1,
      
    };

    const employees:
      EmployeeSchedulingContext[] = [
        {
          employee: employee(
            "tired",
            "Tired"
          ),

          history: [
            assignment(
              "2026-08-08T00:00:00.000Z",
              heavyOtherJob,
              nightShift
            ),
          ],
        },

        {
          employee: employee(
            "rested",
            "Rested"
          ),

          history: [
            assignment(
              "2026-07-01T00:00:00.000Z"
            ),
            assignment(
              "2026-07-02T00:00:00.000Z"
            ),
            assignment(
              "2026-07-03T00:00:00.000Z"
            ),
          ],
        },
      ];

    const ranked =
      rankEmployeesForJob(
        employees,
        guardJob,
        targetDate
      );

    expect(
      ranked[0].employee.id
    ).toBe("rested");
  });

  it("uses employee id as the deterministic final tie-break", () => {
    const employees:
      EmployeeSchedulingContext[] = [
        {
          employee: employee(
            "zulu",
            "Zulu"
          ),
          history: [],
        },

        {
          employee: employee(
            "alpha",
            "Alpha"
          ),
          history: [],
        },
      ];

    const ranked =
      rankEmployeesForJob(
        employees,
        guardJob,
        targetDate
      );

    expect(
      ranked[0].employee.id
    ).toBe("alpha");
  });
});