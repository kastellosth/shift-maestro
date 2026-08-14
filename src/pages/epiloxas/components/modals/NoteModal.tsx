// ─── components/modals/NoteModal.tsx ─────────────────────────────────────────
//
// Notes belong to the employee.
//
// Pins are different: they belong to the schedule currently being prepared.
// Therefore the current pin is passed separately instead of being stored on
// Employee.

import { useState } from "react";
import { X, Pin, PinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type {
  Employee,
  Job,
  ShiftGroup,
  PinnedAssignment,
} from "../../../../types";

import { fullName } from "../../utils";

interface NoteModalProps {
  employee: Employee;

  initialText: string;

  initialPin: PinnedAssignment | null;

  jobs: Job[];
  shifts: ShiftGroup[];

  onSave: (
    empId: string,
    text: string,
    pinned: PinnedAssignment | null
  ) => void;

  onClose: () => void;
}

export function NoteModal({
  employee,
  initialText,
  initialPin,
  jobs,
  shifts,
  onSave,
  onClose,
}: NoteModalProps) {
  const [text, setText] =
    useState(initialText);

  const [pinnedJobKey, setPinnedJobKey] =
    useState<string>(
      initialPin?.jobKey ?? ""
    );

  const [pinnedShiftId, setPinnedShiftId] =
    useState<string>(
      initialPin?.shiftId ?? ""
    );

  const pinComplete =
    pinnedJobKey !== "" &&
    pinnedShiftId !== "";

  const handleSave = () => {
    const pinned: PinnedAssignment | null =
      pinComplete
        ? {
            jobKey: pinnedJobKey,
            shiftId: pinnedShiftId,
          }
        : null;

    onSave(
      employee.id,
      text,
      pinned
    );
  };

  const clearPin = () => {
    setPinnedJobKey("");
    setPinnedShiftId("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-5 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Note — {fullName(employee)}
          </h3>

          <button onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Note
          </label>

          <Textarea
            className="min-h-20 text-sm"
            placeholder="e.g. on medical leave, prefers morning, restricted duty…"
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
          />
        </div>

        {/* Pre-assign */}
        <div className="space-y-2.5 rounded-lg border border-dashed border-border p-3">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">

              {pinComplete ? (
                <Pin className="h-3.5 w-3.5 text-primary" />
              ) : (
                <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}

              <span className="text-xs font-medium">
                {pinComplete
                  ? "Pre-assigned slot"
                  : "Pre-assign to slot"}
              </span>
            </div>

            {(pinComplete || initialPin) && (
              <button
                onClick={clearPin}
                className="text-xs text-destructive hover:underline"
              >
                Clear pin
              </button>
            )}
          </div>

          <p className="text-xs leading-snug text-muted-foreground">
            The scheduler will lock this person into the chosen
            slot first, then fill remaining spots freely.
            Both fields are required.
          </p>

          <div className="grid grid-cols-2 gap-2">

            {/* Job */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Job
              </label>

              <select
                value={pinnedJobKey}
                onChange={(e) =>
                  setPinnedJobKey(e.target.value)
                }
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">
                  — none —
                </option>

                {jobs.map((job) => (
                  <option
                    key={job.key}
                    value={job.key}
                  >
                    {job.label} (×{job.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Shift
              </label>

              <select
                value={pinnedShiftId}
                onChange={(e) =>
                  setPinnedShiftId(e.target.value)
                }
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">
                  — none —
                </option>

                {shifts.map((shift) => (
                  <option
                    key={shift.id}
                    value={shift.id}
                  >
                    Shift {shift.name} (×{shift.difficulty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pinComplete && (
            <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
              <Pin className="h-3 w-3 shrink-0" />

              {fullName(employee)}
              {" → "}
              {
                jobs.find(
                  (job) =>
                    job.key === pinnedJobKey
                )?.label
              }
              {" / Shift "}
              {
                shifts.find(
                  (shift) =>
                    shift.id === pinnedShiftId
                )?.name
              }
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">

          {text.trim() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setText("")}
            >
              Clear note
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}