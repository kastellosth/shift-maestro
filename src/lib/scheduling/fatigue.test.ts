import { describe, expect, it } from "vitest";
import {
  calculateCurrentFatigue,
  getRecencyWeight,
} from "./fatigue";

describe("getRecencyWeight", () => {
  it("decays as assignments get older", () => {
    expect(getRecencyWeight(0)).toBe(1);
    expect(getRecencyWeight(1)).toBe(0.8);
    expect(getRecencyWeight(2)).toBe(0.55);
    expect(getRecencyWeight(3)).toBe(0.35);
    expect(getRecencyWeight(4)).toBe(0.2);
    expect(getRecencyWeight(5)).toBe(0);
  });
});

describe("calculateCurrentFatigue", () => {
  it("weights recent assignment workload by recency", () => {
    const history = [
      {
        date: new Date("2026-08-08"),
        job: {
          id: "job-1",
          key: "guard",
          label: "Guard",
          difficulty: 8,
          requiredPeople: 2,
        },
        shiftGroup: {
          id: "shift-b",
          name: "B",
          label: "Night",
          difficulty: 4,
        },
      },
    ];

    const fatigue = calculateCurrentFatigue(
      history,
      new Date("2026-08-09")
    );

    expect(fatigue).toBeCloseTo(9.6);
  });
});

it("accumulates fatigue from multiple recent assignments", () => {
  const history = [
    {
      date: new Date("2026-08-08"),
      job: {
        id: "guard",
        key: "guard",
        label: "Guard",
        difficulty: 8,
        requiredPeople: 2,
      },
      shiftGroup: {
        id: "night",
        name: "Night",
        label: "Night",
        difficulty: 4,
      },
    },
    {
      date: new Date("2026-08-07"),
      job: {
        id: "office",
        key: "office",
        label: "Office",
        difficulty: 3,
        requiredPeople: 1,
      },
      shiftGroup: {
        id: "day",
        name: "Day",
        label: "Day",
        difficulty: 1,
      },
    },
  ];

  const fatigue = calculateCurrentFatigue(
    history,
    new Date("2026-08-09")
  );

  expect(fatigue).toBeCloseTo(11.8);
});

it("ignores assignments old enough to no longer affect fatigue", () => {
  const history = [
    {
      date: new Date("2026-08-01"),
      job: {
        id: "guard",
        key: "guard",
        label: "Guard",
        difficulty: 8,
        requiredPeople: 2,
      },
      shiftGroup: {
        id: "night",
        name: "Night",
        label: "Night",
        difficulty: 4,
      },
    },
  ];

  const fatigue = calculateCurrentFatigue(
    history,
    new Date("2026-08-09")
  );

  expect(fatigue).toBe(0);
});