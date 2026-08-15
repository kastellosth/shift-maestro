import { describe, expect, it } from "vitest";

import { buildSchedule } from "../scheduler";

import type { Employee } from "../../types/employee";
import type {
  Job,
  ShiftGroup,
  PinnedAssignment,
} from "../../types";

import type { HistoricalAssignment } from "../scheduling/fatigue";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function employee(
  id: string,
  name: string
): Employee {
  return {
    id,
    name,
    surname: "TEST",
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
  employee("e1", "ONE"),
  employee("e2", "TWO"),
  employee("e3", "THREE"),
  employee("e4", "FOUR"),
];

const jobs: Job[] = [
  {
    id: "guard-id",
    key: "guard",
    label: "Guard",
    difficulty: 8,
    requiredPeople: 2,
  },
  {
    id: "office-id",
    key: "office",
    label: "Office",
    difficulty: 2,
    requiredPeople: 1,
  },
];

const shifts: ShiftGroup[] = [
  {
    id: "A",
    name: "A",
    label: "Shift A",
    difficulty: 1,
  },
];

const history: Record<
  string,
  HistoricalAssignment[]
> = {};

const targetDate =
  new Date("2026-08-14T00:00:00.000Z");

// ── Helpers ──────────────────────────────────────────────────────────────────

function findRow(
  schedule: ReturnType<typeof buildSchedule>,
  jobKey: string,
  shiftId = "A"
) {
  const group = schedule.find(
    (g) => g.shiftGroup.id === shiftId
  );

  expect(group).toBeDefined();

  const row = group!.rows.find(
    (r) => r.job.key === jobKey
  );

  expect(row).toBeDefined();

  return row!;
}

function allPeople(
  schedule: ReturnType<typeof buildSchedule>
): string[] {
  return schedule.flatMap((group) =>
    group.rows.flatMap((row) => row.people)
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("buildSchedule pins", () => {
  it("places a pinned employee in the requested slot", () => {
    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "guard",
        shiftId: "A",
      },
    };

    const schedule = buildSchedule(
      employees,
      jobs,
      shifts,
      history,
      targetDate,
      pins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    expect(guard.people).toContain(
      "TEST ONE"
    );
  });

  it("does not assign a pinned employee twice", () => {
    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "guard",
        shiftId: "A",
      },
    };

    const schedule = buildSchedule(
      employees,
      jobs,
      shifts,
      history,
      targetDate,
      pins
    );

    const people = allPeople(schedule);

    const occurrences = people.filter(
      (name) => name === "TEST ONE"
    );

    expect(occurrences).toHaveLength(1);
  });

  it("fills the remaining capacity after placing a pin", () => {
    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "guard",
        shiftId: "A",
      },
    };

    const schedule = buildSchedule(
      employees,
      jobs,
      shifts,
      history,
      targetDate,
      pins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    // Guard requires two people.
    expect(guard.people).toHaveLength(2);

    expect(guard.people).toContain(
      "TEST ONE"
    );
  });

  it("ignores a pin referencing an unknown job", () => {
    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "does-not-exist",
        shiftId: "A",
      },
    };

    expect(() =>
      buildSchedule(
        employees,
        jobs,
        shifts,
        history,
        targetDate,
        pins
      )
    ).not.toThrow();
  });

  it("ignores a pin referencing an unknown shift", () => {
    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "guard",
        shiftId: "does-not-exist",
      },
    };

    expect(() =>
      buildSchedule(
        employees,
        jobs,
        shifts,
        history,
        targetDate,
        pins
      )
    ).not.toThrow();
  });

  it("does not overfill a slot when too many employees are pinned", () => {
    const onePersonJob: Job[] = [
      {
        id: "office-id",
        key: "office",
        label: "Office",
        difficulty: 2,
        requiredPeople: 1,
      },
    ];

    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "office",
        shiftId: "A",
      },

      e2: {
        jobKey: "office",
        shiftId: "A",
      },
    };

    const schedule = buildSchedule(
      employees,
      onePersonJob,
      shifts,
      history,
      targetDate,
      pins
    );

    const office = findRow(
      schedule,
      "office"
    );

    expect(office.people).toHaveLength(1);
  });
});

// ── Historical scheduling tests ──────────────────────────────────────────────

describe("buildSchedule historical ranking", () => {
  const singleGuardJob: Job[] = [
    {
      id: "guard-id",
      key: "guard",
      label: "Guard",
      difficulty: 8,
      requiredPeople: 1,
    },
  ];

  const noPins: Record<string, PinnedAssignment> = {};

  it("prefers an employee whose heavy workload is older", () => {
    const twoEmployees = [
      employee("e1", "RECENT"),
      employee("e2", "OLD"),
    ];

    const heavyJob: Job = {
      id: "heavy-id",
      key: "heavy",
      label: "Heavy Duty",
      difficulty: 9,
      requiredPeople: 1,
    };

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      e1: [
        {
          date: new Date(
            "2026-08-13T00:00:00.000Z"
          ),
          job: heavyJob,
          shiftGroup: shifts[0],
        },
      ],

      e2: [
        {
          date: new Date(
            "2026-08-01T00:00:00.000Z"
          ),
          job: heavyJob,
          shiftGroup: shifts[0],
        },
      ],
    };

    const schedule = buildSchedule(
      twoEmployees,
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      noPins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    expect(guard.people[0]).toBe(
      "TEST OLD"
    );
  });

  it("ignores future-dated history when calculating fatigue", () => {
    const twoEmployees = [
      employee("e1", "FUTURE"),
      employee("e2", "NORMAL"),
    ];

    const heavyJob: Job = {
      id: "heavy-id",
      key: "heavy",
      label: "Heavy Duty",
      difficulty: 9,
      requiredPeople: 1,
    };

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      e1: [
        {
          date: new Date(
            "2026-08-20T00:00:00.000Z"
          ),
          job: heavyJob,
          shiftGroup: shifts[0],
        },
      ],

      e2: [],
    };

    const schedule = buildSchedule(
      twoEmployees,
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      noPins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    // Future history should not count as fatigue.
    // Both candidates therefore tie on job repetition
    // and fatigue; fixture order determines the result.
    expect(guard.people[0]).toBe(
      "TEST FUTURE"
    );
  });

  it("prefers lower historical workload when repetition and fatigue are equal", () => {
    const low = {
      ...employee("e1", "LOW"),
      score: 10,
    };

    const high = {
      ...employee("e2", "HIGH"),
      score: 50,
    };

    const schedule = buildSchedule(
      [high, low],
      singleGuardJob,
      shifts,
      {},
      targetDate,
      noPins
    );

    const guard = findRow(schedule, "guard");

    expect(guard.people[0]).toBe("TEST LOW");
  });


  it("never assigns the same employee to two different slots", () => {
    const schedule = buildSchedule(
      employees,
      jobs,
      shifts,
      {},
      targetDate,
      noPins
    );

    const people = allPeople(schedule);

    expect(new Set(people).size).toBe(people.length);
  });


  it("does not duplicate employees when there are fewer employees than required slots", () => {
    const schedule = buildSchedule(
      [employee("e1", "ONE")],
      singleGuardJob.map((job) => ({
        ...job,
        requiredPeople: 2,
      })),
      shifts,
      {},
      targetDate,
      noPins
    );

    const guard = findRow(schedule, "guard");

    expect(guard.people).toHaveLength(1);
    expect(guard.people[0]).toBe("TEST ONE");
  });

  it("honors a pin even when that employee would rank poorly normally", () => {
    const tired = employee("e1", "TIRED");
    const fresh = employee("e2", "FRESH");

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      e1: [
        {
          date: new Date("2026-08-13T00:00:00.000Z"),
          job: {
            id: "heavy",
            key: "heavy",
            label: "Heavy",
            difficulty: 10,
            requiredPeople: 1,
          },
          shiftGroup: shifts[0],
        },
      ],
      e2: [],
    };

    const pins: Record<string, PinnedAssignment> = {
      e1: {
        jobKey: "guard",
        shiftId: "A",
      },
    };

    const schedule = buildSchedule(
      [tired, fresh],
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      pins
    );

    const guard = findRow(schedule, "guard");

    expect(guard.people[0]).toBe("TEST TIRED");
  });

  it("prefers a rested employee when job repetition is equal", () => {
    const twoEmployees = [
      employee("e1", "TIRED"),
      employee("e2", "RESTED"),
    ];

    const otherJob: Job = {
      id: "other-id",
      key: "other",
      label: "Other Duty",
      difficulty: 9,
      requiredPeople: 1,
    };

    const recentHistory: HistoricalAssignment = {
      date: new Date(
        "2026-08-13T00:00:00.000Z"
      ),
      job: otherJob,
      shiftGroup: shifts[0],
    };

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      e1: [recentHistory],
      e2: [],
    };

    const schedule = buildSchedule(
      twoEmployees,
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      noPins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    expect(guard.people[0]).toBe(
      "TEST RESTED"
    );
  });

  function historicalGuard(
    date: string
  ): HistoricalAssignment {
    return {
      date: new Date(date),

      job: {
        id: "guard-id",
        key: "guard",
        label: "Guard",
        difficulty: 8,
        requiredPeople: 1,
      },

      shiftGroup: {
        id: "A",
        name: "A",
        label: "Shift A",
        difficulty: 1,
      },
    };
  }

  it("prefers an employee who has done the target job fewer times", () => {
    const twoEmployees = [
      employee("e1", "WORKED"),
      employee("e2", "FRESH"),
    ];

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      e1: [
        // Old enough that recent fatigue should not matter.
        historicalGuard(
          "2026-07-01T00:00:00.000Z"
        ),
      ],

      e2: [],
    };

    const schedule = buildSchedule(
      twoEmployees,
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      noPins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    expect(guard.people).toHaveLength(1);

    expect(guard.people[0]).toBe(
      "TEST FRESH"
    );
  });

  it("prefers the less fatigued employee when job repetition is equal", () => {
    const twoEmployees = [
      employee("e1", "TIRED"),
      employee("e2", "RESTED"),
    ];

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      // Same job count: 1.
      //
      // But this employee performed Guard only
      // one day before the target schedule.
      e1: [
        historicalGuard(
          "2026-08-13T00:00:00.000Z"
        ),
      ],

      // Same job count: 1.
      //
      // This assignment is old enough that its
      // short-term fatigue should have decayed.
      e2: [
        historicalGuard(
          "2026-07-01T00:00:00.000Z"
        ),
      ],
    };

    const schedule = buildSchedule(
      twoEmployees,
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      noPins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    expect(guard.people).toHaveLength(1);

    expect(guard.people[0]).toBe(
      "TEST RESTED"
    );
  });

  it("fills the job normally when neither employee has history", () => {
    const twoEmployees = [
      employee("e1", "ONE"),
      employee("e2", "TWO"),
    ];

    const testHistory: Record<
      string,
      HistoricalAssignment[]
    > = {
      e1: [],
      e2: [],
    };

    const schedule = buildSchedule(
      twoEmployees,
      singleGuardJob,
      shifts,
      testHistory,
      targetDate,
      noPins
    );

    const guard = findRow(
      schedule,
      "guard"
    );

    expect(guard.people).toHaveLength(1);

    expect([
      "TEST ONE",
      "TEST TWO",
    ]).toContain(guard.people[0]);
  });
});