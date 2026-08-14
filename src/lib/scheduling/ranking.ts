import type { Employee } from "../../types/employee";
import type { Job } from "../../types";
import {
  calculateCurrentFatigue,
  type HistoricalAssignment,
} from "./fatigue";

export interface EmployeeSchedulingContext {
  employee: Employee;
  history: HistoricalAssignment[];
}

function countJobAssignments(
  history: HistoricalAssignment[],
  jobKey: string
): number {
  return history.filter(
    (assignment) => assignment.job.key === jobKey
  ).length;
}

export function rankEmployeesForJob(
  employees: EmployeeSchedulingContext[],
  job: Job,
  targetDate: Date
): EmployeeSchedulingContext[] {
  return [...employees].sort((a, b) => {
    // 1. Prefer somebody who has performed this job fewer times.
    const aJobCount = countJobAssignments(
      a.history,
      job.key
    );

    const bJobCount = countJobAssignments(
      b.history,
      job.key
    );

    if (aJobCount !== bJobCount) {
      return aJobCount - bJobCount;
    }

    // 2. Prefer somebody who is less fatigued right now.
    const aFatigue = calculateCurrentFatigue(
      a.history,
      targetDate
    );

    const bFatigue = calculateCurrentFatigue(
      b.history,
      targetDate
    );

    if (aFatigue !== bFatigue) {
      return aFatigue - bFatigue;
    }

    // 3. Prefer somebody with less historical workload.
    return a.employee.score - b.employee.score;
  });
}