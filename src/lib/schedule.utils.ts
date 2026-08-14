// src/lib/schedule.utils.ts

import type {
  Employee,
  Job,
  ShiftGroup,
} from "../types";


export function randomScore(): number {
  return Math.floor(Math.random() * 51) + 50;
}

export function fullName(e: Employee): string {
  return `${e.surname} ${e.name}`.trim();
}

export function makeworkload(job: Job, shift: ShiftGroup): number {
  return job.difficulty * shift.difficulty;
}

export function getEmployee(name: string, employees: Employee[]) {
  return employees.find((e) => fullName(e) === name);
}

export function assignmentScore(
  personName: string,
  workload: number,
  employees: Employee[]
): number {
  const emp = getEmployee(personName, employees);
  return (emp?.score ?? 0) + workload;
}
export function scoreStyle(score: number): React.CSSProperties {
  if (score <= 60)  return { backgroundColor: "#EAF3DE", color: "#3B6D11" };
  if (score <= 75)  return { backgroundColor: "#FAEEDA", color: "#854F0B" };
  if (score <= 95)  return { backgroundColor: "#FAECE7", color: "#993C1D" };
  return { backgroundColor: "#FCEBEB", color: "#A32D2D" };
}
 
export function workloadStyle(workload: number): React.CSSProperties {
  if (workload <= 5)  return { backgroundColor: "#EAF3DE", color: "#3B6D11" };
  if (workload <= 10) return { backgroundColor: "#FAEEDA", color: "#854F0B" };
  if (workload <= 15) return { backgroundColor: "#FAECE7", color: "#993C1D" };
  return { backgroundColor: "#FCEBEB", color: "#A32D2D" };
}