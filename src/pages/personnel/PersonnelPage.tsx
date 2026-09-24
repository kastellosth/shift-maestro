import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { selectDisplayed } from "@/stores/employee.selectors";
import { exportEmployees } from "@/lib/employee-export";
import { EmployeeHistoryModal } from "@/pages/personnel/components/EmployeeHistoryModal";
import { FilterBar } from "@/pages/personnel/components/FilterBar";
import { DeleteReasonModal } from "@/pages/personnel/components/DeleteReasonModal";
import { AddEmployeeForm } from "@/pages/personnel/components/AddEmployeeForm";
import { RosterTable } from "@/pages/personnel/components/RosterTable";
import { useEmployeeHistory } from "@/pages/personnel/hooks/useEmployeeHistory";
import { useEmployeeStore } from "@/stores/employee.store";
import { fullName } from "@/lib/utils";

const PersonnelManager = () => {
  const navigate = useNavigate();
  const history = useEmployeeHistory();

  const employees = useEmployeeStore((s) => s.employees);
  const loading = useEmployeeStore((s) => s.loading);
  const saving = useEmployeeStore((s) => s.saving);
  const search = useEmployeeStore((s) => s.search);
  const setSearch = useEmployeeStore((s) => s.setSearch);
  const pendingDelete = useEmployeeStore((s) => s.pendingDelete);
  const activeFilters = useEmployeeStore((s) => s.activeFilters);
  const loadFromDB = useEmployeeStore((s) => s.loadFromDB);
  const saveAll = useEmployeeStore((s) => s.saveAll);
  const confirmDelete = useEmployeeStore((s) => s.confirmDelete);
  const cancelDelete = useEmployeeStore((s) => s.cancelDelete);

  const unsavedCount = employees.filter((e) => e.status !== "saved").length;

  const handleReload = () => {
    if (
      unsavedCount > 0 &&
      !window.confirm(
        `You have ${unsavedCount} unsaved change${unsavedCount === 1 ? "" : "s"}. ` +
        "Reloading from the database will discard them. Continue?",
      )
    ) {
      return;
    }

    void loadFromDB();
  };

  const displayed = useMemo(
    () => selectDisplayed(employees, search, activeFilters),
    [employees, search, activeFilters],
  );

  useEffect(() => {
    void loadFromDB();
  }, [loadFromDB]);

  const pendingNames = (pendingDelete ?? []).map((id) => {
    const employee = employees.find((e) => e.id === id);
    return employee ? fullName(employee) : id;
  });

  return (
    <div className="min-h-screen bg-background">

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {pendingDelete && (
        <DeleteReasonModal
          count={pendingDelete.length}
          names={pendingNames}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      {history.employee && !history.loading && (
        <EmployeeHistoryModal
          employee={history.employee}
          history={history.history}
          onClose={history.close}
        />
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Personnel Manager</h1>
          {unsavedCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              {unsavedCount} unsaved
            </Badge>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReload} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportEmployees(employees)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={saveAll} disabled={saving || unsavedCount === 0}>
              <Save className={`mr-2 h-4 w-4 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving..." : `Save changes (${unsavedCount})`}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="container mx-auto space-y-6 px-6 py-8">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Import employees from CSV</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground hover:border-primary transition-colors">
              <Upload className="h-5 w-5" />
              Upload CSV
              {/* TODO: not wired up yet — no onChange handler. Either
                  implement lib/csv-import.ts or remove this card until it's real. */}
              <input type="file" accept=".csv" className="hidden" />
            </label>
          </Card>

          <AddEmployeeForm />
        </div>

        <FilterBar />

        <RosterTable
          employees={employees}
          displayed={displayed}
          search={search}
          onSearchChange={setSearch}
          onViewHistory={history.view}
        />

        {employees.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
            <Upload className="mx-auto h-10 w-10 opacity-30 mb-3" />
            No employees yet — load from DB or add manually
          </div>
        )}
      </main>
    </div>
  );
};

export default PersonnelManager;