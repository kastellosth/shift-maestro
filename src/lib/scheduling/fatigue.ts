import type { Job, ShiftGroup } from "../../types";
import { calculateAssignmentWorkload } from "./workload";

export interface HistoricalAssignment {
  date: Date;
  job: Job;
  shiftGroup: ShiftGroup;
}

export function getRecencyWeight(daysAgo: number): number {
  if (daysAgo <= 0) return 1.0;
  if (daysAgo === 1) return 0.8;
  if (daysAgo === 2) return 0.55;
  if (daysAgo === 3) return 0.35;
  if (daysAgo === 4) return 0.2;

  return 0;
}

export function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 86_400_000;

  const a = new Date(dateA);
  const b = new Date(dateB);

  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);

  return Math.floor(
    (b.getTime() - a.getTime()) / msPerDay
  );
}

export function calculateCurrentFatigue(
  history: HistoricalAssignment[],
  targetDate: Date = new Date()
): number {
  return history.reduce((total, assignment) => {
    const daysAgo = daysBetween(
      assignment.date,
      targetDate
    );

    if (daysAgo < 0) {
      return total;
    }

    const workload = calculateAssignmentWorkload(
      assignment.job,
      assignment.shiftGroup
    );

    return (
      total +
      workload * getRecencyWeight(daysAgo)
    );
  }, 0);
}