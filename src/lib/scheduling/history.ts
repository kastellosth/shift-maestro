import type { HistoricalAssignment } from "./fatigue";

type ApiHistoricalAssignment = {
  assignmentId: string;
  date: string;
  job: HistoricalAssignment["job"];
  shiftGroup: HistoricalAssignment["shiftGroup"];
};

export type ApiAssignmentHistory = Record<
  string,
  ApiHistoricalAssignment[]
>;

export type AssignmentHistory = Record<
  string,
  HistoricalAssignment[]
>;

export function parseAssignmentHistory(
  raw: ApiAssignmentHistory
): AssignmentHistory {
  const parsed: AssignmentHistory = {};

  for (const [employeeId, assignments] of Object.entries(raw)) {
    parsed[employeeId] = assignments.map((assignment) => ({
      date: new Date(assignment.date),
      job: assignment.job,
      shiftGroup: assignment.shiftGroup,
    }));
  }

  return parsed;
}