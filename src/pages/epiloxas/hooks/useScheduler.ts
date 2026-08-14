// ─── hooks/useScheduler.ts ────────────────────────────────────────────────────
//
// The scheduler hook controls generation and live drag-and-drop changes.
//
// Historical assignments are NOT created when Generate is clicked.
// Real history will come from persisted assignments in the database.

import {
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";


import type {
  Employee,
  Job,
  ShiftGroup,
  ScheduleGroup,
  PinnedAssignment,
} from "../../../types";



import { buildSchedule } from "../../../lib/scheduler";
import {
  parseAssignmentHistory,
  type AssignmentHistory,
  type ApiAssignmentHistory,
} from "../../../lib/scheduling/history";

// ── Types ─────────────────────────────────────────────────────────────────────


export interface UseSchedulerReturn {
  schedule: ScheduleGroup[] | null;
  history: AssignmentHistory;

  generateSchedule: () => void;

  handleDragStart: (
    groupIdx: number,
    jobKey: string,
    personIdx: number
  ) => void;

  handleDrop: (
    targetGroup: number,
    targetJob: string,
    targetPerson: number
  ) => void;

  resetSchedule: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useScheduler(
  employees: Employee[],
  jobs: Job[],
  shifts: ShiftGroup[],
  pins: Record<string, PinnedAssignment>
): UseSchedulerReturn {
  const [schedule, setSchedule] =
    useState<ScheduleGroup[] | null>(null);

  // Temporary empty history.
  //
  // Next step will be replacing this with real Assignment history
  // loaded from the backend/database.
  const [history, setHistory] =
  useState<AssignmentHistory>({});
  
useEffect(() => {
  const loadHistory = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/assignment-history"
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load history: ${response.status}`
        );
      }

      const raw = await response.json();

const parsed = parseAssignmentHistory(
  raw as ApiAssignmentHistory
);

setHistory(parsed);
    } catch (error) {
      console.error(
        "Failed to load assignment history:",
        error
      );

      toast.error(
        "Could not load assignment history"
      );
    }
  };

  loadHistory();
}, []);

  const [dragItem, setDragItem] = useState<{
    groupIdx: number;
    jobKey: string;
    personIdx: number;
  } | null>(null);

  // ── Required personnel ───────────────────────────────────────────────────

  const totalSlotsNeeded =
    shifts.length *
    jobs.reduce(
      (total, job) => total + job.requiredPeople,
      0
    );

  // ── Generate schedule ────────────────────────────────────────────────────

  const generateSchedule = () => {
    if (employees.length < totalSlotsNeeded) {
      toast.error(
        `Need at least ${totalSlotsNeeded} employees`
      );
      return;
    }

    const targetDate = new Date();

    const groups = buildSchedule(
  employees,
  jobs,
  shifts,
  history,
  targetDate,
  pins
);

    setSchedule(groups);

    toast.success("Schedule generated!");
  };

  // ── Drag start ───────────────────────────────────────────────────────────

  const handleDragStart = (
    groupIdx: number,
    jobKey: string,
    personIdx: number
  ) => {
    setDragItem({
      groupIdx,
      jobKey,
      personIdx,
    });
  };

  // ── Drag/drop swap ───────────────────────────────────────────────────────

  const handleDrop = (
    targetGroup: number,
    targetJob: string,
    targetPerson: number
  ) => {
    if (!dragItem || !schedule) {
      return;
    }

    // Clone the schedule so React state is never mutated directly.
    const next: ScheduleGroup[] = schedule.map(
      (group) => ({
        ...group,

        rows: group.rows.map((row) => ({
          ...row,
          people: [...row.people],
        })),
      })
    );

    const findRow = (
      groupIndex: number,
      jobKey: string
    ) =>
      next[groupIndex].rows.find(
        (row) => row.job.key === jobKey
      );

    const sourceRow = findRow(
      dragItem.groupIdx,
      dragItem.jobKey
    );

    const targetRow = findRow(
      targetGroup,
      targetJob
    );

    if (!sourceRow || !targetRow) {
      setDragItem(null);
      return;
    }

    const sourcePerson =
      sourceRow.people[dragItem.personIdx];

    const targetPersonName =
      targetRow.people[targetPerson];

    if (
      sourcePerson === undefined ||
      targetPersonName === undefined
    ) {
      setDragItem(null);
      return;
    }

    sourceRow.people[dragItem.personIdx] =
      targetPersonName;

    targetRow.people[targetPerson] =
      sourcePerson;

    setSchedule(next);
    setDragItem(null);

    toast.info("Assignment swapped");
  };

  // ── Reset preview ────────────────────────────────────────────────────────

  const resetSchedule = () => {
    setSchedule(null);
    setDragItem(null);
  };

  return {
    schedule,
    history,
    generateSchedule,
    handleDragStart,
    handleDrop,
    resetSchedule,
  };
}