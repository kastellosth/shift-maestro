import type {
  Employee,
  PinnedAssignment,
  ScheduleGroup,
} from "../../types";

import { fullName } from "../../lib/utils";

export interface FinalizedAssignmentInput {
  jobId: string;
  shiftGroupId: string;

  members: {
    employeeId: string;
    pinned: boolean;
  }[];
}

export interface FinalizeSchedulePayload {
  date: string;
  assignments: FinalizedAssignmentInput[];
}

export function buildFinalizeSchedulePayload(
  schedule: ScheduleGroup[],
  employees: Employee[],
  pins: Record<string, PinnedAssignment>,
  targetDate: Date
): FinalizeSchedulePayload {

  const employeesByName = new Map<
    string,
    Employee[]
  >();

  for (const employee of employees) {
    const name = fullName(employee);

    const matches =
      employeesByName.get(name) ?? [];

    matches.push(employee);

    employeesByName.set(
      name,
      matches
    );
  }

  const seenEmployeeIds =
    new Set<string>();

  const assignments =
    schedule.flatMap((group) =>
      group.rows.map((row) => {
        if (
          row.people.length !==
          row.job.requiredPeople
        ) {
          throw new Error(
            `Job "${row.job.label}" requires ` +
              `${row.job.requiredPeople} employee(s), ` +
              `but the schedule contains ${row.people.length}`
          );
        }

        const members = row.people.map(
          (personName) => {
            const matches =
              employeesByName.get(personName) ??
              [];

            if (matches.length === 0) {
              throw new Error(
                `Scheduled employee not found: ${personName}`
              );
            }

            if (matches.length > 1) {
              throw new Error(
                `Scheduled employee name is ambiguous: ${personName}`
              );
            }

            const employee = matches[0];

            if (
              seenEmployeeIds.has(employee.id)
            ) {
              throw new Error(
                `Employee appears more than once in schedule: ${personName}`
              );
            }

            seenEmployeeIds.add(employee.id);

            const pin = pins[employee.id];

            const pinned =
              !!pin &&
              pin.jobKey === row.job.key &&
              pin.shiftId ===
                row.shiftGroup.id;

            return {
              employeeId: employee.id,
              pinned,
            };
          }
        );

        return {
          jobId: row.job.id,
          shiftGroupId:
            row.shiftGroup.id,
          members,
        };
      })
    );

  return {
    date: targetDate.toISOString(),
    assignments,
  };
}