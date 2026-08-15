// ─── components/schedule/ScheduleTable.tsx ───────────────────────────────────
//
// Added pin highlight: when a person's pinned assignment matches the current
// row's job+shift, they get a blue ring + Pin icon to make pre-assignments
// visually distinct from both normal and noted employees.
//
// Highlight priority (highest → lowest):
//   1. Pinned  → blue ring, Pin icon
//   2. HasNote → amber ring, StickyNote icon  
//   3. Normal  → muted background

import { Download, AlertTriangle, GripVertical, StickyNote, Pin, CheckCircle2, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Employee, Job, ScheduleGroup, ShiftGroup, PinnedAssignment } from "../../../../types";
import {
  scoreStyle, workloadStyle, detectConflicts,
  buildScheduleCSV, downloadCSV, assignmentScore, getEmployeeByName
} from "../../utils";


interface ScheduleTableProps {
  schedule: ScheduleGroup[];
  employees: Employee[];
  jobs: Job[];
  shifts: ShiftGroup[];

  pins: Record<string, PinnedAssignment>;

  onDragStart: (
    groupIdx: number,
    jobKey: string,
    personIdx: number
  ) => void;

  onDrop: (
    targetGroup: number,
    targetJob: string,
    targetPerson: number
  ) => void;

  onFinalize: () => Promise<void>;
  isFinalizing: boolean;
}

export function ScheduleTable({
  schedule, employees, jobs, shifts, onDragStart, onDrop, pins, onFinalize,
  isFinalizing,
}: ScheduleTableProps) {
  const conflicts = detectConflicts(schedule);

  const handleDownload = () => downloadCSV(buildScheduleCSV(schedule));

  const renderPersonCell = (
    groupIdx: number,
    jobKey: string,
    shiftId: string,
    person: string,
    personIdx: number,
    workload: number,
  ) => {
    const aScore = assignmentScore(person, workload, employees);
    const emp = getEmployeeByName(person, employees);
    const hasNote = !!emp?.notes;

    const pin = emp
      ? pins[emp.id]
      : undefined;

    const isPinned =
      !!pin &&
      pin.jobKey === jobKey &&
      pin.shiftId === shiftId;

    // Style priority: pinned > has-note > normal
    const containerClass = isPinned
      ? "border-blue-400/70 bg-blue-50 dark:bg-blue-950/30"
      : hasNote
        ? "border-amber-400/60 bg-amber-50 dark:bg-amber-950/30"
        : "border-transparent bg-muted";

    const nameClass = isPinned
      ? "font-semibold text-blue-800 dark:text-blue-300"
      : hasNote
        ? "font-semibold text-amber-800 dark:text-amber-300"
        : "";

    return (
      <TableCell
        key={personIdx}
        draggable
        onDragStart={() => onDragStart(groupIdx, jobKey, personIdx)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(groupIdx, jobKey, personIdx)}
        className="cursor-grab active:cursor-grabbing"
      >
        <div
          className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors hover:border-primary/40 ${containerClass}`}
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <span className={nameClass}>{person}</span>

          {/* Show pin icon if pinned here, note icon if has note (or both) */}
          {isPinned && (
            <Pin className="h-3 w-3 shrink-0 text-blue-500" />
          )}
          {hasNote && !isPinned && (
            <StickyNote className="h-3 w-3 shrink-0 text-amber-500" />
          )}
          {isPinned && hasNote && (
            <StickyNote className="h-3 w-3 shrink-0 text-amber-400 opacity-70" />
          )}

          <span
            className="ml-auto inline-block rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
            style={scoreStyle(aScore)}
          >
            {aScore}
          </span>
        </div>
      </TableCell>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Generated Schedule</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isFinalizing}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>

          <Button
            size="sm"
            onClick={onFinalize}
            disabled={
              isFinalizing ||
              conflicts.length > 0
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />

            {isFinalizing
              ? "Finalizing..."
              : "Finalize Schedule"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {conflicts.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Conflict: {conflicts.join(", ")} assigned to multiple slots
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Jobs —</span>
          {jobs.map((j) => (
            <span key={j.key}>
              {j.label}: <span className="font-medium text-foreground">×{j.difficulty}</span>
              <span className="ml-1 opacity-60">({j.requiredPeople}p)</span>
            </span>
          ))}
          <span className="font-medium text-foreground ml-3">Shifts —</span>
          {shifts.map((s) => (
            <span key={s.id}>
              {s.name}: <span className="font-medium text-foreground">×{s.difficulty}</span>
            </span>
          ))}
          <span className="w-full opacity-70 mt-0.5">
            Score badge = base score + workload &nbsp;·&nbsp;
            <span className="text-amber-600">■ amber = has note</span>
            &nbsp;·&nbsp;
            <span className="text-blue-600">■ blue = pre-assigned</span>
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Drag &amp; drop names between cells to swap assignments.
        </p>

        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Workload</TableHead>
                <TableHead>Person 1</TableHead>
                <TableHead>Person 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((group, gi) =>
                group.rows.map((row, ri) => (
                  <TableRow key={`${gi}-${ri}`} className={ri === 0 ? "bg-primary/5" : undefined}>
                    {ri === 0 && (
                      <TableCell
                        rowSpan={group.rows.length}
                        className="font-semibold text-primary align-top pt-3"
                      >
                        <div className="text-base">{group.shiftGroup.name}</div>
                        <div className="text-xs font-normal text-muted-foreground leading-tight mt-0.5 max-w-[150px] whitespace-normal">
                          {group.shiftGroup.label}
                        </div>
                        <span className="text-xs font-normal text-muted-foreground">
                          ×{group.shiftGroup.difficulty}
                        </span>
                      </TableCell>
                    )}

                    <TableCell className="font-medium whitespace-nowrap">
                      {row.job.label}
                      <span className="ml-1.5 text-xs text-muted-foreground">×{row.job.difficulty}</span>
                    </TableCell>

                    <TableCell>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={workloadStyle(row.workload)}
                      >
                        {row.workload}
                      </span>
                    </TableCell>

                    {row.people.map((person, pi) =>
                      renderPersonCell(
                        gi,
                        row.job.key,
                        group.shiftGroup.id,   // ← pass shiftId for pin matching
                        person,
                        pi,
                        row.workload,
                      ),
                    )}
                    {row.people.length < 2 && (
                      <TableCell className="text-muted-foreground text-xs italic">—</TableCell>
                    )}
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
