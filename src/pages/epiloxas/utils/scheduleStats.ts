// ─── utils/scheduleStats.ts ───────────────────────────────────────────────────
//
// Pure functions that derive stats from a completed schedule.
// Zero React, zero side-effects — easy to unit-test in isolation.
//
// Three stats surfaces:
//   1. Spider (radar) data — how many people each company contributed
//   2. Company burden ranking — total workload load per company
//   3. Individual burden ranking — the hardest-hit people in the schedule

import type { Employee, ScheduleGroup } from "../../../types";
import { getEmployeeByName } from "./index";
import  { fullName } from "../../../lib/utils";

// ─── 1. Spider data ───────────────────────────────────────────────────────────

export interface SpiderDataPoint {
  company: string;   // "Co. 1"
  count: number;     // how many employees from this company are in the schedule
  total: number;     // total employees loaded from this company (for %)
}

/** Counts how many scheduled people belong to each company. */
export function buildSpiderData(
  schedule: ScheduleGroup[],
  allEmployees: Employee[],
): SpiderDataPoint[] {
  // Count scheduled appearances per company
  const scheduledNames = new Set(
    schedule.flatMap((g) => g.rows.flatMap((r) => r.people)),
  );

  const companyCount: Record<number, { scheduled: number; total: number }> = {};

  for (const emp of allEmployees) {
    if (!companyCount[emp.company]) {
      companyCount[emp.company] = { scheduled: 0, total: 0 };
    }
    companyCount[emp.company].total += 1;
    if (scheduledNames.has(fullName(emp))) {
      companyCount[emp.company].scheduled += 1;
    }
  }

  return Object.entries(companyCount)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([company, { scheduled, total }]) => ({
      company: `Co. ${company}`,
      count: scheduled,
      total,
    }));
}

// ─── 2. Company burden ────────────────────────────────────────────────────────

export interface CompanyBurden {
  company: number;
  totalWorkload: number;        // sum of all workload values for people from this company
  avgworkload: number;          // totalWorkload / number of scheduled people
  scheduledCount: number;
  hardestSlot: { jobLabel: string; shiftName: string; workload: number } | null;
}

/** Calculates total and average workload load per company. */
export function buildCompanyBurden(
  schedule: ScheduleGroup[],
  allEmployees: Employee[],
): CompanyBurden[] {
  const data: Record<number, {
    totalWorkload: number;
    count: number;
    hardestWorkload: number;
    hardestSlot: CompanyBurden["hardestSlot"];
  }> = {};

  for (const group of schedule) {
    for (const row of group.rows) {
      for (const personName of row.people) {
        const emp = getEmployeeByName(personName, allEmployees);
        if (!emp) continue;

        if (!data[emp.company]) {
          data[emp.company] = { totalWorkload: 0, count: 0, hardestWorkload: 0, hardestSlot: null };
        }

        data[emp.company].totalWorkload += row.workload;
        data[emp.company].count += 1;

        if (row.workload > data[emp.company].hardestWorkload) {
          data[emp.company].hardestWorkload = row.workload;
          data[emp.company].hardestSlot = {
            jobLabel: row.job.label,
            shiftName: group.shiftGroup.name,
            workload: row.workload,
          };
        }
      }
    }
  }

  return Object.entries(data)
    .map(([company, d]) => ({
      company: Number(company),
      totalWorkload: d.totalWorkload,
      avgworkload: d.count > 0 ? Math.round(d.totalWorkload / d.count) : 0,
      scheduledCount: d.count,
      hardestSlot: d.hardestSlot,
    }))
    .sort((a, b) => b.totalWorkload - a.totalWorkload);
}

// ─── 3. Individual burden ─────────────────────────────────────────────────────

export interface PersonBurden {
  name: string;
  company: number;
  totalWorkload: number;
  slots: {
    jobLabel: string;
    shiftName: string;
    workload: number;
  }[];
}

export function buildPersonBurden(
  schedule: ScheduleGroup[],
  allEmployees: Employee[],
): PersonBurden[] {
  const data: Record<string, PersonBurden> = {};

  for (const group of schedule) {
    for (const row of group.rows) {
      for (const personName of row.people) {
        const emp = getEmployeeByName(
          personName,
          allEmployees
        );

        if (!emp) continue;

        if (!data[personName]) {
          data[personName] = {
            name: personName,
            company: emp.company,
            totalWorkload: 0,
            slots: [],
          };
        }

        data[personName].totalWorkload +=
          row.workload;

        data[personName].slots.push({
          jobLabel: row.job.label,
          shiftName: group.shiftGroup.name,
          workload: row.workload,
        });
      }
    }
  }

  return Object.values(data).sort(
    (a, b) =>
      b.totalWorkload -
      a.totalWorkload
  );
}