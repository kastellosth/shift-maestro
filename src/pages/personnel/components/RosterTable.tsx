import { History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEmployeeStore } from "@/stores/employee.store";
import {
  ESSO_OPTIONS,
  ICLASS_OPTIONS,
  daysInService,
} from "@/types/employee";
import type {
  EmployeeViewModel,
  EmployeeSyncStatus,
  EssoBatch,
  IClass,
} from "@/types/employee";

const STATUS_STYLES: Record<EmployeeSyncStatus, string> = {
  new: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  dirty: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  saved: "text-green-600 bg-green-50 dark:bg-green-950/30",
};

const COLUMN_HEADERS = [
  "Surname", "Name", "Co.", "ΕΣΣΟ", "Entry date",
  "Days", "I-class", "Armed", "Notes", "Status", "",
];

interface RosterTableProps {
  employees: EmployeeViewModel[];
  displayed: EmployeeViewModel[];
  search: string;
  onSearchChange: (value: string) => void;
  onViewHistory: (employee: EmployeeViewModel) => void;
}

export function RosterTable({
  employees,
  displayed,
  search,
  onSearchChange,
  onViewHistory,
}: RosterTableProps) {
  const selected = useEmployeeStore((s) => s.selected);
  const updateEmployee = useEmployeeStore((s) => s.updateEmployee);
  const toggleSelect = useEmployeeStore((s) => s.toggleSelect);
  const toggleAll = useEmployeeStore((s) => s.toggleAll);
  const requestDelete = useEmployeeStore((s) => s.requestDelete);
  const requestDeleteSelected = useEmployeeStore((s) => s.requestDeleteSelected);

  if (employees.length === 0) return null;

  const allDisplayedSelected =
    displayed.length > 0 &&
    displayed.every((employee) => selected.has(employee.id));

  return (
    <Card>
      <div className="flex items-center justify-between p-4">
        <h2 className="font-medium">
          Roster <Badge variant="secondary">{displayed.length}/{employees.length}</Badge>
        </h2>
        <div className="flex items-center gap-2">
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…" className="h-8 w-48" />
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={requestDeleteSelected}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete {selected.size}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allDisplayedSelected}
                  onChange={() => toggleAll(displayed)}
                  className="h-3.5 w-3.5 accent-primary"
                />
              </th>
              {COLUMN_HEADERS.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayed.map((emp) => {
              const days = emp.essoEntryDate ? daysInService(emp.essoEntryDate) : null;

              return (
                <tr key={emp.id}
                  className={`hover:bg-muted/30 transition-colors ${selected.has(emp.id) ? "bg-primary/5" : ""}`}>

                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={selected.has(emp.id)}
                      onChange={() => toggleSelect(emp.id)} className="h-3.5 w-3.5 accent-primary" />
                  </td>

                  <td className="px-3 py-2 font-medium">
                    <input value={emp.surname}
                      onChange={(e) => updateEmployee(emp.id, "surname", e.target.value)}
                      className="bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" />
                  </td>

                  <td className="px-3 py-2">
                    <input value={emp.name}
                      onChange={(e) => updateEmployee(emp.id, "name", e.target.value)}
                      className="bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" />
                  </td>

                  <td className="px-3 py-2">
                    <input type="number" min={1} value={emp.company}
                      onChange={(e) => updateEmployee(emp.id, "company", parseInt(e.target.value) || 1)}
                      className="bg-transparent w-12 focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" />
                  </td>

                  <td className="px-3 py-2">
                    <select value={emp.esso ?? ""}
                      onChange={(e) =>
                        updateEmployee(
                          emp.id,
                          "esso",
                          (e.target.value || null) as EssoBatch | null,
                        )
                      }
                      className="bg-transparent text-sm focus:outline-none">
                      <option value="">—</option>
                      {ESSO_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={emp.essoEntryDate ?? ""}
                      onChange={(e) =>
                        updateEmployee(emp.id, "essoEntryDate", e.target.value || null)
                      }
                      className="bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
                    />
                  </td>

                  <td className="px-3 py-2 tabular-nums text-xs">
                    {days !== null
                      ? <span className="font-medium text-foreground">{days}</span>
                      : <span className="opacity-40">—</span>}
                  </td>

                  <td className="px-3 py-2">
                    <select value={emp.iClass ?? ""}
                      onChange={(e) =>
                        updateEmployee(
                          emp.id,
                          "iClass",
                          (e.target.value || null) as IClass | null,
                        )
                      }
                      className="bg-transparent text-sm focus:outline-none">
                      <option value="">—</option>
                      {ICLASS_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </td>

                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => updateEmployee(emp.id, "armed", !emp.armed)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${emp.armed
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                        }`}>
                      {emp.armed ? "Yes" : "No"}
                    </button>
                  </td>

                  <td className="px-3 py-2">
                    <input
                      value={emp.notes ?? ""}
                      onChange={(e) =>
                        updateEmployee(emp.id, "notes", e.target.value || null)
                      }
                      placeholder="—"
                      className="bg-transparent min-w-40 w-full focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[emp.status]}`}>
                      {emp.status}
                    </span>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewHistory(emp)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        title="View assignment history"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => requestDelete(emp.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Remove employee"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}