// ─── components/employees/EmployeeTable.tsx ──────────────────────────────────
//
// WHY THIS FILE EXISTS:
//   This component has one job: render a filterable, sortable list of employees.
//   It knows nothing about schedules, drag-drop, or the DB modal.
//
//   "Single Responsibility Principle" — every component should do one thing.
//   When you come back in 3 months to add a column, you open this file, not
//   a 900-line page file. The search/sort controls are co-located here because
//   they only affect this table.

import { ArrowUpDown, StickyNote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "../../../../types";
import { scoreStyle } from "../../utils";

interface EmployeeTableProps {
  employees: Employee[];
  onNoteClick: (empId: string, currentText: string) => void;
  /** Slot in the header for the Generate button (passed from parent) */
  headerAction?: React.ReactNode;
}

export function EmployeeTable({ employees, onNoteClick, headerAction }: EmployeeTableProps) {
  const [search,  setSearch]  = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const q = search.toLowerCase();
  const displayed = employees
    .filter((e) => e.name.toLowerCase().includes(q) || e.surname.toLowerCase().includes(q))
    .sort((a, b) => sortDir === "desc" ? b.score - a.score : a.score - b.score);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Employee List</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent className="space-y-3">

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name or surname…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 text-sm"
          />
          <Button
            variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Score: {sortDir === "desc" ? "High → Low" : "Low → High"}
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {displayed.length} / {employees.length}
          </Badge>
        </div>

        <div className="max-h-72 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Surname</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Co.</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-12 text-center">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((emp, i) => {
                const hasNote = !!emp.notes;
                return (
                  <TableRow
                    key={emp.id}
                    className={hasNote ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}
                  >
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className={`font-medium ${hasNote ? "text-amber-800 dark:text-amber-300" : ""}`}>
                      {emp.surname}
                      {hasNote && <StickyNote className="inline ml-1.5 h-3 w-3 text-amber-500" />}
                    </TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.company}</TableCell>
                    <TableCell>
                      <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={scoreStyle(emp.score)}>
                        {emp.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => onNoteClick(emp.id, emp.notes ?? "")}
                        title={hasNote ? emp.notes ?? "" : "Add note"}
                        className={`rounded p-1 transition-colors ${
                          hasNote
                            ? "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <StickyNote className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
