// ─── components/personnel/DeleteReasonModal.tsx ───────────────────────────────
//
// Shown whenever pendingDelete !== null in the store.
// Forces the user to pick a reason BEFORE the deletion is executed.
//
// Reasons are defined as a union type in types/employee.ts so adding a new
// reason in the future only requires changing one place.
//
// The modal is intentionally simple: no text input, just two clearly-labelled
// options. This makes misuse harder and audit logs cleaner.

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DeleteReason } from "../../types/employee";
import { DELETE_REASON_LABELS } from "../../types/employee";

interface DeleteReasonModalProps {
  /** How many employees are being deleted (for the confirmation message) */
  count: number;
  /** Names of employees being deleted (shown in the modal body) */
  names: string[];
  onConfirm: (reason: DeleteReason) => void;
  onCancel:  () => void;
}

export function DeleteReasonModal({ count, names, onConfirm, onCancel }: DeleteReasonModalProps) {
  const [selected, setSelected] = useState<DeleteReason | null>(null);

  const reasons = Object.entries(DELETE_REASON_LABELS) as [DeleteReason, string][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-base">
                Remove {count === 1 ? "1 employee" : `${count} employees`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a reason to continue. This action cannot be undone.
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="mt-0.5 shrink-0">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Names preview (max 5 shown) */}
        {names.length > 0 && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm space-y-0.5">
            {names.slice(0, 5).map((n) => (
              <div key={n} className="text-foreground font-medium">{n}</div>
            ))}
            {names.length > 5 && (
              <div className="text-xs text-muted-foreground">
                +{names.length - 5} more
              </div>
            )}
          </div>
        )}

        {/* Reason selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Reason for removal</p>
          <div className="space-y-2">
            {reasons.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-colors ${
                  selected === key
                    ? "border-destructive bg-destructive/5 text-foreground"
                    : "border-border hover:border-destructive/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Radio dot */}
                <span className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                  selected === key ? "border-destructive" : "border-muted-foreground"
                }`}>
                  {selected === key && (
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                  )}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selected === null}
            onClick={() => selected && onConfirm(selected)}
          >
            Confirm removal
          </Button>
        </div>

      </div>
    </div>
  );
}
