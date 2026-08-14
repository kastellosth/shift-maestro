import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

import type { EmployeeViewModel } from "../../types/employee";

function scoreStyle(score: number): React.CSSProperties {
  if (score <= 60) return { backgroundColor: "#EAF3DE", color: "#3B6D11" };
  if (score <= 75) return { backgroundColor: "#FAEEDA", color: "#854F0B" };
  if (score <= 95) return { backgroundColor: "#FAECE7", color: "#993C1D" };
  return { backgroundColor: "#FCEBEB", color: "#A32D2D" };
}

type Props = {
  employees: EmployeeViewModel[];
  displayed: EmployeeViewModel[];
  selected: Set<string>;

  toggleSelect: (id: string) => void;
  toggleAll: () => void;

  updateEmployee: (
    id: string,
    field: keyof Omit<EmployeeViewModel, "id" | "status">,
    value: string | number | boolean | null
  ) => void;

  requestDelete: (id: string) => void;
};

export default function EmployeeTable({
  employees,
  displayed,
  selected,
  toggleSelect,
  toggleAll,
  updateEmployee,
  requestDelete,
}: Props) {
  return (
    <div className="max-h-[500px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={
                  selected.size > 0 &&
                  selected.size === displayed.length
                }
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border"
              />
            </TableHead>

            <TableHead>Surname</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Co.</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="w-16 text-center">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {displayed.map((emp) => (
            <TableRow
              key={emp.id}
              className={
                selected.has(emp.id)
                  ? "bg-primary/5"
                  : emp.status === "new"
                  ? "bg-green-50/50 dark:bg-green-950/20"
                  : emp.status === "dirty"
                  ? "bg-amber-50/50 dark:bg-amber-950/20"
                  : ""
              }
            >
              {/* checkbox */}
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.has(emp.id)}
                  onChange={() => toggleSelect(emp.id)}
                  className="h-4 w-4 rounded border-border"
                />
              </TableCell>

              {/* surname */}
              <TableCell>
                <Input
                  value={emp.surname}
                  onChange={(e) =>
                    updateEmployee(emp.id, "surname", e.target.value)
                  }
                  className="h-7 text-sm border-0 bg-transparent p-0"
                />
              </TableCell>

              {/* name */}
              <TableCell>
                <Input
                  value={emp.name}
                  onChange={(e) =>
                    updateEmployee(emp.id, "name", e.target.value)
                  }
                  className="h-7 text-sm border-0 bg-transparent p-0"
                />
              </TableCell>

              {/* company */}
              <TableCell>
                <Input
                  type="number"
                  min={1}
                  value={emp.company}
                  onChange={(e) =>
                    updateEmployee(
                      emp.id,
                      "company",
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                  className="h-7 w-14 text-sm border-0 bg-transparent p-0"
                />
              </TableCell>

              {/* score */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    value={emp.score}
                    onChange={(e) =>
                      updateEmployee(
                        emp.id,
                        "score",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="h-7 w-16 text-sm border-0 bg-transparent p-0"
                  />

                  <span
                    className="inline-block rounded-full px-1.5 py-0.5 text-xs font-medium"
                    style={scoreStyle(emp.score)}
                  >
                    {emp.score}
                  </span>
                </div>
              </TableCell>

              {/* status */}
              <TableCell className="text-center">
                {emp.status === "saved" ? (
                  <Badge variant="secondary" className="text-xs">
                    saved
                  </Badge>
                ) : emp.status === "new" ? (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-700 border-green-300"
                  >
                    new
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-700 border-amber-300"
                  >
                    edited
                  </Badge>
                )}
              </TableCell>

              {/* delete */}
              <TableCell>
                <button
                  onClick={() => requestDelete(emp.id)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}