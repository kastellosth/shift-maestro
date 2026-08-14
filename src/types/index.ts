// ─── src/types/index.ts ───────────────────────────────────────────────────────
//
// Central export point for shared application types.
//
// Employee-related types live in ./employee.
// Scheduler-related shared types live here.
//
// This avoids defining multiple different Employee interfaces across the app.

// ── Employee types ────────────────────────────────────────────────────────────

export type {
  Employee,
  EmployeeViewModel,
  EmployeeSyncStatus,
  EssoBatch,
  IClass,
} from "./employee";

// ── Schedule pin ──────────────────────────────────────────────────────────────
//
// Kept as a standalone scheduling concept for now.
// It should NOT live directly on Employee because a pin belongs to a specific
// schedule/assignment, not permanently to the employee.

export interface PinnedAssignment {
  jobKey: string;
  shiftId: string;
}

// ── Job ───────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  key: string;
  label: string;
  difficulty: number;

  // Current business rule: jobs require 1 or 2 people.
  requiredPeople: number;
}

// ── Shift ─────────────────────────────────────────────────────────────────────

export interface ShiftGroup {
  id: string;
  name: string;
  label: string;
  difficulty: number;
}

// ── Generated schedule ────────────────────────────────────────────────────────

export interface ScheduleRow {
  job: Job;
  shiftGroup: ShiftGroup;

  // Currently kept as names because the existing UI expects strings.
  // Later we may improve this to store employee IDs as well.
  people: string[];

  // Difficulty of this specific job + shift combination.
  // This is NOT employee fatigue.
  workload: number;
}

export interface ScheduleGroup {
  shiftGroup: ShiftGroup;
  rows: ScheduleRow[];
}