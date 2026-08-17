import type {
  Employee,
} from "../../types/employee";

import type {
  Job,
} from "../../types";

import {
  calculateCurrentFatigue,
  type HistoricalAssignment,
} from "./fatigue";

import {
  calculateRecentWorkload,
} from "./employeeStats";

export interface EmployeeSchedulingContext {
  employee: Employee;
  history: HistoricalAssignment[];
}

function countJobAssignments(
  history: HistoricalAssignment[],
  jobKey: string
): number {
  return history.filter(
    (assignment) =>
      assignment.job.key === jobKey
  ).length;
}

export function rankEmployeesForJob(
  employees: EmployeeSchedulingContext[],
  job: Job,
  targetDate: Date
): EmployeeSchedulingContext[] {
  return [...employees].sort((a, b) => {
    // ── 1. Recovery comes first ──────────────────────────
    //
    // The most rested available person should be preferred,
    // especially for difficult work.

    const aFatigue =
      calculateCurrentFatigue(
        a.history,
        targetDate
      );

    const bFatigue =
      calculateCurrentFatigue(
        b.history,
        targetDate
      );

    if (aFatigue !== bFatigue) {
      return aFatigue - bFatigue;
    }

    // ── 2. Keep recent workload balanced ────────────────
    //
    // If both employees are similarly rested, prefer the
    // person who has carried less workload over the last week.

    const aRecentWorkload =
      calculateRecentWorkload(
        a.history,
        targetDate
      );

    const bRecentWorkload =
      calculateRecentWorkload(
        b.history,
        targetDate
      );

    if (
      aRecentWorkload !==
      bRecentWorkload
    ) {
      return (
        aRecentWorkload -
        bRecentWorkload
      );
    }

    // ── 3. Job rotation ─────────────────────────────────
    //
    // Only after recovery/workload are balanced do we prefer
    // somebody who has performed this particular job fewer times.

    const aJobCount =
      countJobAssignments(
        a.history,
        job.key
      );

    const bJobCount =
      countJobAssignments(
        b.history,
        job.key
      );

    if (aJobCount !== bJobCount) {
      return aJobCount - bJobCount;
    }

    // ── 4. Deterministic final tie-break ─────────────────
    //
    // Avoid relying on input-array ordering when all scheduling
    // factors are genuinely identical.

    return a.employee.id.localeCompare(
      b.employee.id
    );
  });
}