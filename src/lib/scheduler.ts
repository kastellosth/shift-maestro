// src/lib/scheduler.ts

import type { Employee } from "../types/employee";

import type {
  Job,
  ShiftGroup,
  ScheduleGroup,
  PinnedAssignment,
} from "../types";

import { fullName } from "./schedule.utils";

import type { HistoricalAssignment } from "./scheduling/fatigue";

import {
  rankEmployeesForJob,
  type EmployeeSchedulingContext,
} from "./scheduling/ranking";

import { calculateAssignmentWorkload } from "./scheduling/workload";

type Slot = {
  job: Job;
  shift: ShiftGroup;
  workload: number;
};

export function buildSchedule(
  employees: Employee[],
  jobs: Job[],
  shifts: ShiftGroup[],
  history: Record<string, HistoricalAssignment[]>,
  targetDate: Date,
  pins: Record<string, PinnedAssignment>
): ScheduleGroup[] {
  // ── 1. Build job/shift slots ──────────────────────────────────────────────

  const slots: Slot[] = [];

  for (const shift of shifts) {
    for (const job of jobs) {
      slots.push({
        job,
        shift,
        workload: calculateAssignmentWorkload(job, shift),
      });
    }
  }

  // Hardest assignments first.
  //
  // This scheduler is greedy, so slot ordering matters.
  //
  // Our scheduling doctrine is:
  //   hardest work → most rested available employee
  //
  // Processing difficult slots first prevents the best-rested people
  // from being consumed by easy duties before harder work is assigned.
  slots.sort(
    (a, b) =>
      b.workload - a.workload
  );

  // ── 2. Build available employee pool ─────────────────────────────────────

  // Employees are NOT globally sorted anymore.
  //
  // Their ranking depends on the particular job and target date:
  //
  //   1. lower current fatigue
//   2. lower recent workload
//   3. fewer repetitions of this job
  const pool = [...employees];

  // Employees already assigned somewhere in this generated schedule.
  const assigned = new Set<string>();

  // ── 3. Pick employees for one slot ───────────────────────────────────────

  const pickForSlot = (
    slot: Slot,
    requiredPeople: number
  ): Employee[] => {
    const available = pool.filter(
      (employee) => !assigned.has(employee.id)
    );

    const contexts: EmployeeSchedulingContext[] =
      available.map((employee) => ({
        employee,
        history: history[employee.id] ?? [],
      }));

    const ranked = rankEmployeesForJob(
      contexts,
      slot.job,
      targetDate
    );

    const picked = ranked
      .slice(0, requiredPeople)
      .map((context) => context.employee);

    for (const employee of picked) {
      assigned.add(employee.id);
    }

    return picked;
  };

  // ── 4. Create schedule groups ─────────────────────────────────────────────

  const groupMap = new Map<string, ScheduleGroup>();

  for (const shift of shifts) {
    groupMap.set(shift.id, {
      shiftGroup: shift,
      rows: [],
    });
  }

  // ── 5. Create empty rows for every slot ─────────────────────────────────────

  for (const slot of slots) {
    groupMap.get(slot.shift.id)!.rows.push({
      job: slot.job,
      shiftGroup: slot.shift,
      people: [],
      workload: slot.workload,
    });
  }

  // ── 6. Place pinned employees first ─────────────────────────────────────────

  for (const employee of employees) {
    const pin = pins[employee.id];

    if (!pin) {
      continue;
    }

    const group = groupMap.get(pin.shiftId);

    // Invalid / deleted shift.
    if (!group) {
      continue;
    }

    const row = group.rows.find(
      (candidate) =>
        candidate.job.key === pin.jobKey
    );

    // Invalid / deleted job.
    if (!row) {
      continue;
    }

    // Do not overfill the slot.
    if (row.people.length >= row.job.requiredPeople) {
      continue;
    }

    row.people.push(fullName(employee));

    // A pinned employee must not be selected again later.
    assigned.add(employee.id);
  }

  // ── 7. Fill remaining positions using normal ranking ────────────────────────

  for (const slot of slots) {
    const group = groupMap.get(slot.shift.id)!;

    const row = group.rows.find(
      (candidate) =>
        candidate.job.key === slot.job.key
    )!;

    const remaining =
      row.job.requiredPeople -
      row.people.length;

    if (remaining <= 0) {
      continue;
    }

    const picked = pickForSlot(
      slot,
      remaining
    );

    row.people.push(
      ...picked.map(fullName)
    );
  }

  // ── 8. Return groups in configured shift order ──────────────────────────────

  return shifts.map(
    (shift) => groupMap.get(shift.id)!
  );
}