// ─── utils/index.ts ───────────────────────────────────────────────────────────
//
// Shared pure helpers for the Epiloxas UI.
//
// IMPORTANT:
// The scheduling algorithm no longer lives here.
// The real scheduler is now:
//
//   src/lib/scheduler.ts
//
// and the scheduling-domain logic lives under:
//
//   src/lib/scheduling/
//
// This file should stay focused on UI-friendly helpers such as names,
// styling, conflict detection, and CSV export.

import type {
  Employee,
  ScheduleGroup,
} from "../../../types";

// ── Employee helpers ──────────────────────────────────────────────────────────

export function randomScore(): number {
  return Math.floor(Math.random() * 51) + 50;
}

export function fullName(employee: Employee): string {
  return `${employee.surname} ${employee.name}`.trim();
}

export function getEmployeeByName(
  name: string,
  employees: Employee[]
): Employee | undefined {
  return employees.find(
    (employee) => fullName(employee) === name
  );
}

// ── Burden / workload helpers ─────────────────────────────────────────────────
//
// Transitional UI helper.
//
// score = historical workload summary
// workload = difficulty of the newly assigned job + shift
//
// Later we may replace this with a richer projected-burden calculation
// that also includes current fatigue.

export function assignmentScore(
  personName: string,
  workload: number,
  employees: Employee[]
): number {
  const employee = getEmployeeByName(
    personName,
    employees
  );

  return (employee?.score ?? 0) + workload;
}

// ── Style helpers ─────────────────────────────────────────────────────────────

export function scoreStyle(
  score: number
): React.CSSProperties {
  if (score <= 60) {
    return {
      backgroundColor: "#EAF3DE",
      color: "#3B6D11",
    };
  }

  if (score <= 75) {
    return {
      backgroundColor: "#FAEEDA",
      color: "#854F0B",
    };
  }

  if (score <= 95) {
    return {
      backgroundColor: "#FAECE7",
      color: "#993C1D",
    };
  }

  return {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
  };
}

export function workloadStyle(
  workload: number
): React.CSSProperties {
  if (workload <= 5) {
    return {
      backgroundColor: "#EAF3DE",
      color: "#3B6D11",
    };
  }

  if (workload <= 10) {
    return {
      backgroundColor: "#FAEEDA",
      color: "#854F0B",
    };
  }

  if (workload <= 15) {
    return {
      backgroundColor: "#FAECE7",
      color: "#993C1D",
    };
  }

  return {
    backgroundColor: "#FCEBEB",
    color: "#A32D2D",
  };
}

// ── Schedule conflict detection ───────────────────────────────────────────────
//
// Returns names that appear more than once in the generated schedule.

export function detectConflicts(
  schedule: ScheduleGroup[]
): string[] {
  const allNames = schedule.flatMap(
    (group) =>
      group.rows.flatMap(
        (row) => row.people
      )
  );

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of allNames) {
    if (seen.has(name)) {
      duplicates.add(name);
    } else {
      seen.add(name);
    }
  }

  return Array.from(duplicates);
}

// ── CSV export ────────────────────────────────────────────────────────────────

export function buildScheduleCSV(
  schedule: ScheduleGroup[]
): string {
  let csv =
    "Shift,Shift Difficulty,Job,Job Difficulty,Workload,Assigned People\n";

  for (const {
    shiftGroup,
    rows,
  } of schedule) {
    for (const {
      job,
      workload,
      people,
    } of rows) {
      csv +=
        `${shiftGroup.label},` +
        `${shiftGroup.difficulty},` +
        `${job.label},` +
        `${job.difficulty},` +
        `${workload},` +
        `${people.join(" | ")}\n`;
    }
  }

  return csv;
}

export function downloadCSV(
  csv: string,
  filename = "schedule_epiloxas.csv"
): void {
  const blob = new Blob(
    [csv],
    { type: "text/csv" }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}