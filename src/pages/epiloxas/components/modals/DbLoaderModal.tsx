// ─── components/modals/DbLoaderModal.tsx ─────────────────────────────────────
//
// WHY THIS FILE EXISTS:
//   The DB loader modal is ~150 lines of JSX with two distinct "steps" inside
//   it. Extracting it means:
//     • The page file doesn't need to know about ChevronDown, Search, or any
//       of the company-picker logic
//       only this file
//     • The component is "dumb" about data fetching: it receives handlers from
//       useDbLoader and just calls them

import { X, Users, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Employee } from "../../../../types";
import type { DBLoaderStep } from "../../hooks/useDbLoader";

interface DbLoaderModalProps {
  // Step control
  dbStep: DBLoaderStep;
  setDbStep: (s: DBLoaderStep) => void;
  dbLoading: boolean;
  onClose: () => void;

  // Actions for step "choose"
  onLoadAll: () => void;
  onOpenCompanyPicker: () => void;

  // State + actions for step "company"
  dbEmployees: Employee[];
  dbCompanies: number[];
  dbSearchQ: string;
  dbSearch: string;
  setDbSearch: (v: string) => void;
  companyChecks: Record<number, Set<string>>;
  companyCollapsed: Record<number, boolean>;
  totalSelected: number;
  toggleCompanyAll: (company: number) => void;
  toggleCompanyEmployee: (company: number, id: string) => void;
  toggleCompanyCollapse: (company: number) => void;
  onConfirmSelection: () => void;
}

export function DbLoaderModal(props: DbLoaderModalProps) {
  const {
    dbStep, setDbStep, dbLoading, onClose,
    onLoadAll, onOpenCompanyPicker,
    dbEmployees, dbCompanies, dbSearchQ, dbSearch, setDbSearch,
    companyChecks, companyCollapsed, totalSelected,
    toggleCompanyAll, toggleCompanyEmployee, toggleCompanyCollapse,
    onConfirmSelection,
  } = props;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl">

        {/* ── Modal header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold text-base">Load from Database</h3>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* ── Step: choose ─────────────────────────────────────────────── */}
        {dbStep === "choose" && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Choose how to load employees from the database:
            </p>

            <button
              onClick={onLoadAll}
              disabled={dbLoading}
              className="w-full flex items-center gap-3 rounded-lg border-2 border-border hover:border-primary px-5 py-4 text-left transition-colors disabled:opacity-50"
            >
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="font-medium text-sm">Load All Companies</div>
                <div className="text-xs text-muted-foreground">Import every employee from the database</div>
              </div>
            </button>

            <button
              onClick={onOpenCompanyPicker}
              disabled={dbLoading}
              className="w-full flex items-center gap-3 rounded-lg border-2 border-border hover:border-primary px-5 py-4 text-left transition-colors disabled:opacity-50"
            >
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="font-medium text-sm">Choose by Company</div>
                <div className="text-xs text-muted-foreground">Pick specific companies or individual employees</div>
              </div>
            </button>

            {dbLoading && (
              <p className="text-xs text-center text-muted-foreground animate-pulse pt-1">Loading…</p>
            )}
          </div>
        )}

        {/* ── Step: company picker ──────────────────────────────────────── */}
        {dbStep === "company" && (
          <>
            {/* Search bar */}
            <div className="px-5 pt-3 pb-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name or surname…"
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {dbSearch && (
                  <button
                    onClick={() => setDbSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Company list */}
            <div className="max-h-[380px] overflow-y-auto divide-y">
              {dbCompanies.map((company) => {
                const allEmpList  = dbEmployees.filter((e) => e.company === company);
                const empList     = dbSearchQ
                  ? allEmpList.filter(
                      (e) =>
                        e.surname.toLowerCase().includes(dbSearchQ) ||
                        e.name.toLowerCase().includes(dbSearchQ),
                    )
                  : allEmpList;

                if (dbSearchQ && empList.length === 0) return null;

                const checks     = companyChecks[company] ?? new Set<string>();
                const allChecked = allEmpList.length > 0 && allEmpList.every((e) => checks.has(e.id));
                const someChecked = allEmpList.some((e) => checks.has(e.id));
                const collapsed  = !dbSearchQ && !!companyCollapsed[company];

                return (
                  <div key={company}>
                    {/* Company header */}
                    <div className="flex items-center gap-2.5 px-5 py-2.5 hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => toggleCompanyCollapse(company)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        {collapsed
                          ? <ChevronRight className="h-4 w-4" />
                          : <ChevronDown  className="h-4 w-4" />
                        }
                      </button>

                      <input
                        type="checkbox"
                        id={`co-${company}`}
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={() => toggleCompanyAll(company)}
                        className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
                      />
                      <label
                        htmlFor={`co-${company}`}
                        className="flex-1 font-semibold text-sm cursor-pointer select-none"
                        onClick={(e) => { e.preventDefault(); toggleCompanyCollapse(company); }}
                      >
                        Company {company}
                        <span className="ml-2 font-normal text-xs text-muted-foreground">
                          {allEmpList.length} people
                        </span>
                      </label>

                      <span
                        onClick={() => toggleCompanyAll(company)}
                        className="text-xs px-2 py-0.5 rounded-full border border-primary/40 text-primary cursor-pointer hover:bg-primary/10 transition-colors select-none"
                      >
                        Full Company
                      </span>

                      {checks.size > 0 && (
                        <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5 shrink-0">
                          {checks.size}/{allEmpList.length}
                        </span>
                      )}
                    </div>

                    {/* Employee rows */}
                    {!collapsed && (
                      <div className="bg-muted/20 border-t border-border/40">
                        {empList.map((emp) => (
                          <label
                            key={emp.id}
                            className="flex items-center gap-2.5 cursor-pointer px-5 py-1.5 hover:bg-muted transition-colors ml-6"
                          >
                            <input
                              type="checkbox"
                              checked={checks.has(emp.id)}
                              onChange={() => toggleCompanyEmployee(company, emp.id)}
                              className="h-3.5 w-3.5 rounded accent-primary cursor-pointer shrink-0"
                            />
                            <span className="text-sm font-medium">{emp.surname}</span>
                            <span className="text-sm text-muted-foreground">{emp.name}</span>
                            
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-5 py-3">
              <span className="text-xs text-muted-foreground">
                {totalSelected} employee{totalSelected !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDbStep("choose")}>
                  Back
                </Button>
                <Button size="sm" onClick={onConfirmSelection} disabled={totalSelected === 0}>
                  Load Selected
                </Button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
