// ─── utils/index.ts ───────────────────────────────────────────────────────────
//
// Shared pure helpers for the Epiloxas UI.
//
// 

import type {
  Employee,
  ScheduleGroup,
} from "../../../types";
import { fullName } from "../../../lib/utils";

// ── Employee helpers ──────────────────────────────────────────────────────────





export function getEmployeeByName(
  name: string,
  employees: Employee[]
): Employee | undefined {
  return employees.find(
    (employee) => fullName(employee) === name
  );
}


// ── Style helpers ─────────────────────────────────────────────────────────────



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