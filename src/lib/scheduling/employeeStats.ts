import type {
  HistoricalAssignment,
} from "./fatigue";

import {
  daysBetween,
} from "./fatigue";

import {
  calculateAssignmentWorkload,
} from "./workload";

export interface EmployeeScheduleStats {
  assignmentCount: number;
  historicalWorkload: number;
  currentFatigue: number;
  lastAssignmentDate: Date | null;
  daysSinceLastAssignment: number | null;

  mostFrequentJob: {
    key: string;
    label: string;
    count: number;
  } | null;
}

/**
 * Total workload carried in the recent scheduling window.
 *
 * This is deliberately different from fatigue:
 *
 * fatigue:
 *   heavily weighted toward the last 4 days
 *
 * recent workload:
 *   simple workload total across the last 7 days
 *
 * This helps prevent workload highs/lows across the crew.
 */
export function calculateRecentWorkload(
  history: HistoricalAssignment[],
  targetDate: Date,
  windowDays = 7
): number {
  return history.reduce(
    (total, assignment) => {
      const daysAgo = daysBetween(
        assignment.date,
        targetDate
      );

      
      if (daysAgo < 0) {
        return total;
      }

      
      if (daysAgo >= windowDays) {
        return total;
      }

      return (
        total +
        calculateAssignmentWorkload(
          assignment.job,
          assignment.shiftGroup
        )
      );
    },
    0
  );
}