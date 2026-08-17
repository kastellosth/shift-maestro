import { X, History, Pin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { EmployeeViewModel } from "../../types/employee";
import type { HistoricalAssignment } from "../../lib/scheduling/fatigue";

import {
  calculateAssignmentWorkload,
} from "../../lib/scheduling/workload";

import {
  calculateCurrentFatigue,
  daysBetween,
} from "../../lib/scheduling/fatigue";

export interface EmployeeHistoryEntry
  extends HistoricalAssignment {
  assignmentId: string;
  pinned?: boolean;
}

interface EmployeeHistoryModalProps {
  employee: EmployeeViewModel;
  history: EmployeeHistoryEntry[];
  onClose: () => void;
}

export function EmployeeHistoryModal({
  employee,
  history,
  onClose,
}: EmployeeHistoryModalProps) {
  const sortedHistory = [...history].sort(
    (a, b) =>
      b.date.getTime() -
      a.date.getTime()
  );
  const today = new Date();

  const totalWorkload =
    sortedHistory.reduce(
      (total, assignment) =>
        total +
        calculateAssignmentWorkload(
          assignment.job,
          assignment.shiftGroup
        ),
      0
    );

  const currentFatigue =
    calculateCurrentFatigue(
      sortedHistory,
      today
    );



  const pastHistory = sortedHistory.filter(
    (assignment) =>
      daysBetween(
        assignment.date,
        today
      ) >= 0
  );

  const lastAssignment =
    pastHistory[0] ?? null;

  const daysSinceLastAssignment =
    lastAssignment
      ? daysBetween(
        lastAssignment.date,
        today
      )
      : null;



  const jobCounts = new Map<
    string,
    {
      label: string;
      count: number;
    }
  >();

  for (const assignment of sortedHistory) {
    const current =
      jobCounts.get(assignment.job.key);

    jobCounts.set(
      assignment.job.key,
      {
        label: assignment.job.label,
        count:
          (current?.count ?? 0) + 1,
      }
    );
  }

  const mostFrequentJob =
    Array.from(jobCounts.values()).sort(
      (a, b) => b.count - a.count
    )[0] ?? null;

  const formatDate = (
    date: Date
  ): string =>
    new Intl.DateTimeFormat(
      "en-GB",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-card shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h3 className="text-base font-semibold">
                {employee.surname}{" "}
                {employee.name}
              </h3>

              <p className="text-xs text-muted-foreground">
                Assignment history and workload statistics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary statistics */}
        <div className="grid grid-cols-2 gap-3 border-b px-6 py-4 md:grid-cols-5">

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">
              Assignments
            </div>
            <div className="mt-1 text-xl font-semibold">
              {sortedHistory.length}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">
              Total workload
            </div>
            <div className="mt-1 text-xl font-semibold">
              {totalWorkload}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">
              Current fatigue
            </div>
            <div className="mt-1 text-xl font-semibold">
              {currentFatigue.toFixed(1)}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">
              Last duty
            </div>
            <div className="mt-1 text-sm font-semibold">
              {lastAssignment
                ? formatDate(
                  lastAssignment.date
                )
                : "—"}
            </div>

            {daysSinceLastAssignment !==
              null && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {daysSinceLastAssignment} day
                  {daysSinceLastAssignment ===
                    1
                    ? ""
                    : "s"}{" "}
                  ago
                </div>
              )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground">
              Most used job
            </div>

            <div className="mt-1 text-sm font-semibold">
              {mostFrequentJob
                ? mostFrequentJob.label
                : "—"}
            </div>

            {mostFrequentJob && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {mostFrequentJob.count} assignment
                {mostFrequentJob.count ===
                  1
                  ? ""
                  : "s"}
              </div>
            )}
          </div>
        </div>

        {/* History table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {sortedHistory.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
              No finalized assignments yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Job
                    </TableHead>

                    <TableHead>
                      Shift
                    </TableHead>

                    <TableHead>
                      Workload
                    </TableHead>

                    <TableHead className="text-center">
                      Pinned
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedHistory.map(
                    (assignment) => {
                      const workload =
                        calculateAssignmentWorkload(
                          assignment.job,
                          assignment.shiftGroup
                        );

                      return (
                        <TableRow
                          key={
                            assignment.assignmentId
                          }
                        >
                          <TableCell className="whitespace-nowrap">
                            {formatDate(
                              assignment.date
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="font-medium">
                              {
                                assignment
                                  .job.label
                              }
                            </div>

                            <div className="text-xs text-muted-foreground">
                              difficulty{" "}
                              {
                                assignment
                                  .job
                                  .difficulty
                              }
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium">
                              {
                                assignment
                                  .shiftGroup
                                  .name
                              }
                            </div>

                            <div className="max-w-[220px] text-xs text-muted-foreground">
                              {
                                assignment
                                  .shiftGroup
                                  .label
                              }
                            </div>
                          </TableCell>

                          <TableCell>
                            {workload}
                          </TableCell>

                          <TableCell className="text-center">
                            {assignment.pinned ? (
                              <Pin className="mx-auto h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-6 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}