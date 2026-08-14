import { describe, expect, it } from "vitest";
import { rankEmployeesForJob } from "./ranking";

describe("rankEmployeesForJob", () => {
  it("prefers the less fatigued employee when job counts are equal", () => {
    const guardJob = {
      id: "guard",
      key: "guard",
      label: "Guard",
      difficulty: 8,
      requiredPeople: 2,
    };

    const nightShift = {
      id: "night",
      name: "Night",
      label: "Night",
      difficulty: 4,
    };

    const employees = [
      {
      employee: {
  id: "john",
  name: "John",
  surname: "Smith",
  company: 2,
  score: 10,

  esso: null,
  essoEntryDate: null,
  iClass: null,
  armed: false,
  notes: null,
},
        history: [
          {
            date: new Date("2026-08-08"),
            job: guardJob,
            shiftGroup: nightShift,
          },
        ],
      },
      {
        employee: {
  id: "maria",
  name: "Maria",
  surname: "Jones",
  company: 2,
  score: 10,

  esso: null,
  essoEntryDate: null,
  iClass: null,
  armed: false,
  notes: null,
},
        history: [
          {
            date: new Date("2026-08-01"),
            job: guardJob,
            shiftGroup: nightShift,
          },
        ],
      },
    ];

    const ranked = rankEmployeesForJob(
      employees,
      guardJob,
      new Date("2026-08-09")
    );

    expect(ranked[0].employee.id).toBe("maria");
  });
});

it("prefers the employee who has done the job fewer times", () => {
  const guardJob = {
    id: "guard",
    key: "guard",
    label: "Guard",
    difficulty: 8,
    requiredPeople: 2,
  };

  const nightShift = {
    id: "night",
    name: "Night",
    label: "Night",
    difficulty: 4,
  };

  const employees = [
    {
      employee: {
        id: "john",
        name: "John",
        surname: "Smith",
        company: 2,
        score: 5,
        esso: null,
        essoEntryDate: null,
        iClass: null,
        armed: false,
        notes: null,
      },
      history: [
        {
          date: new Date("2026-08-01"),
          job: guardJob,
          shiftGroup: nightShift,
        },
        {
          date: new Date("2026-08-02"),
          job: guardJob,
          shiftGroup: nightShift,
        },
      ],
    },
    {
      employee: {
        id: "maria",
        name: "Maria",
        surname: "Jones",
        company: 2,
        score: 50,
        esso: null,
        essoEntryDate: null,
        iClass: null,
        armed: false,
        notes: null,
      },
      history: [],
    },
  ];

  const ranked = rankEmployeesForJob(
    employees,
    guardJob,
    new Date("2026-08-09")
  );

  expect(ranked[0].employee.id).toBe("maria");
});

it("prefers lower historical workload when repetition and fatigue are equal", () => {
  const officeJob = {
    id: "office",
    key: "office",
    label: "Office",
    difficulty: 2,
    requiredPeople: 1,
  };

  const dayShift = {
    id: "day",
    name: "Day",
    label: "Day",
    difficulty: 1,
  };

  const employees = [
    {
      employee: {
        id: "john",
        name: "John",
        surname: "Smith",
        company: 2,
        score: 80,
        esso: null,
        essoEntryDate: null,
        iClass: null,
        armed: false,
        notes: null,
      },
      history: [],
    },
    {
      employee: {
        id: "maria",
        name: "Maria",
        surname: "Jones",
        company: 2,
        score: 20,
        esso: null,
        essoEntryDate: null,
        iClass: null,
        armed: false,
        notes: null,
      },
      history: [],
    },
  ];

  const ranked = rankEmployeesForJob(
    employees,
    officeJob,
    new Date("2026-08-09")
  );

  expect(ranked[0].employee.id).toBe("maria");
});