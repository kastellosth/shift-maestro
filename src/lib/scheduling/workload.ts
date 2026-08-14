// src/lib/scheduling/workload.ts

import type { Job, ShiftGroup } from "../../types";

export function calculateAssignmentWorkload(
  job: Job,
  shift: ShiftGroup
): number {
  return job.difficulty + shift.difficulty;
}