// ─── src/PersonnelManager.tsx ─────────────────────────────────────────────────
//
// Sits at src/ root (same level as the original).
// All imports resolve from that level.

import { useNavigate }    from "react-router-dom";
import {
  ArrowLeft, RefreshCw, Save, Download, Upload, Trash2,
} from "lucide-react";
import { Button }    from "@/components/ui/button";
import { Card }      from "@/components/ui/card";
import { Badge }     from "@/components/ui/badge";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { FilterBar } from "@/pages/personnel/FilterBar";
import { DeleteReasonModal } from "@/pages/personnel/DeleteReasonModal";

import { useEmployeeStore, selectDisplayed } from "@/stores/employee.store";
import { daysInService }     from "@/types/employee";
import type { EssoBatch, IClass } from "@/types/employee";

const ESSO_OPTIONS: EssoBatch[] = ["Α", "Β", "Γ", "Δ", "Ε", "ΣΤ"];
const ICLASS_OPTIONS: IClass[]  = ["I1", "I2", "I3", "I4", "I5"];

const PersonnelManager = () => {

  
  const navigate = useNavigate();

  const employees           = useEmployeeStore((s) => s.employees);
  const loading             = useEmployeeStore((s) => s.loading);
  const saving              = useEmployeeStore((s) => s.saving);
  const search              = useEmployeeStore((s) => s.search);
  const setSearch           = useEmployeeStore((s) => s.setSearch);
  const selected            = useEmployeeStore((s) => s.selected);
  const form                = useEmployeeStore((s) => s.form);
  const setForm             = useEmployeeStore((s) => s.setForm);
  const formError           = useEmployeeStore((s) => s.formError);
  const pendingDelete       = useEmployeeStore((s) => s.pendingDelete);

  const loadFromDB            = useEmployeeStore((s) => s.loadFromDB);
  const addEmployee           = useEmployeeStore((s) => s.addEmployee);
  const updateEmployee        = useEmployeeStore((s) => s.updateEmployee);
  const saveAll               = useEmployeeStore((s) => s.saveAll);
  const toggleSelect          = useEmployeeStore((s) => s.toggleSelect);
  const toggleAll             = useEmployeeStore((s) => s.toggleAll);
  const requestDelete             = useEmployeeStore((s) => s.requestDelete);
  const requestDeleteSelected = useEmployeeStore((s) => s.requestDeleteSelected);
  const confirmDelete         = useEmployeeStore((s) => s.confirmDelete);
  const cancelDelete          = useEmployeeStore((s) => s.cancelDelete);
    const filters = useEmployeeStore((s) => s.activeFilters);

  const unsavedCount = employees.filter((e) => e.status !== "saved").length;



  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    const f = filters;

    return [...employees]
      .filter((e) => {
        if (
          q &&
          !(
            e.name.toLowerCase().includes(q) ||
            e.surname.toLowerCase().includes(q) ||
            String(e.company).includes(q)
          )
        ) return false;

        if (f.company !== null && e.company !== f.company) return false;
        if (f.esso !== null && e.esso !== f.esso) return false;
        if (f.iClass !== null && e.iClass !== f.iClass) return false;
        if (f.armed !== null && e.armed !== f.armed) return false;

        return true;
      })
      .sort((a, b) => {
        if (f.groupBy === "company") return a.company - b.company;
        if (f.groupBy === "esso") return (a.esso ?? "").localeCompare(b.esso ?? "");

        if (f.groupBy === "daysInService") {
          const da = a.essoEntryDate ? daysInService(a.essoEntryDate) : 0;
          const db = b.essoEntryDate ? daysInService(b.essoEntryDate) : 0;
          return db - da;
        }

        return 0;
      });
  }, [employees, search, filters]);

  const pendingNames = (pendingDelete ?? []).map((id) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? `${e.surname} ${e.name}`.trim() : id;
  });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(employees, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "employees.json"; a.click();
    URL.revokeObjectURL(url);
  };
  

  return (
    <div className="min-h-screen bg-background">

      {/* ── Delete reason modal ───────────────────────────────────────── */}
      {pendingDelete && (
        <DeleteReasonModal
          count={pendingDelete.length}
          names={pendingNames}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
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
            <Button variant="outline" size="sm" onClick={loadFromDB} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Load
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={saveAll} disabled={saving || unsavedCount === 0}>
              <Save className={`mr-2 h-4 w-4 ${saving ? "animate-spin" : ""}`} />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="container mx-auto space-y-6 px-6 py-8">

        {/* ── Import + Add form ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <Card className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Import employees from CSV</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground hover:border-primary transition-colors">
              <Upload className="h-5 w-5" />
              Upload CSV
              <input type="file" accept=".csv" className="hidden" />
            </label>
          </Card>

          <Card className="p-4 space-y-3">
            <p className="text-sm font-medium">Add Employee</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Surname *</Label>
                <Input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })}
                  placeholder="Παπαδόπουλος" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Γιώργος" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <Input type="number" min={1} value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Score</Label>
                <Input type="number" value={form.score} placeholder="auto"
                  onChange={(e) => setForm({ ...form, score: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">ΕΣΣΟ batch</Label>
                <select value={form.esso}
                  onChange={(e) => setForm({ ...form, esso: e.target.value as EssoBatch | "" })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">— none —</option>
                  {ESSO_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entry date override</Label>
                <Input type="date" value={form.essoEntryDate}
                  onChange={(e) => setForm({ ...form, essoEntryDate: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">I-class</Label>
                <select value={form.iClass}
                  onChange={(e) => setForm({ ...form, iClass: e.target.value as IClass | "" })}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">— none —</option>
                  {ICLASS_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Armed</Label>
                <button onClick={() => setForm({ ...form, armed: !form.armed })}
                  className={`h-8 w-full rounded-md border text-sm font-medium transition-colors ${
                    form.armed
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}>
                  {form.armed ? "Yes — Armed" : "No — Unarmed"}
                </button>
              </div>
            </div>

            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <Button size="sm" className="w-full" onClick={addEmployee}>Add to roster</Button>
          </Card>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────── */}
        <FilterBar />

        {/* ── Roster table ──────────────────────────────────────────── */}
        {employees.length > 0 && (
          <Card>
            <div className="flex items-center justify-between p-4">
              <h2 className="font-medium">
                Roster <Badge variant="secondary">{displayed.length}/{employees.length}</Badge>
              </h2>
              <div className="flex items-center gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
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
                      <input type="checkbox"
                        checked={selected.size === displayed.length && displayed.length > 0}
                        onChange={() => toggleAll(displayed)}
                        className="h-3.5 w-3.5 accent-primary" />
                    </th>
                    {["Surname","Name","Co.","Score","ΕΣΣΟ","Days","I-class","Armed","Status",""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayed.map((emp) => {
                    const days = emp.essoEntryDate ? daysInService(emp.essoEntryDate) : null;
                    const statusColor =
                      emp.status === "new"   ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30" :
                      emp.status === "dirty" ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30" :
                      "text-green-600 bg-green-50 dark:bg-green-950/30";

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
                          <input type="number" value={emp.score}
                            onChange={(e) => updateEmployee(emp.id, "score", parseInt(e.target.value) || 0)}
                            className="bg-transparent w-14 focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" />
                        </td>

                        <td className="px-3 py-2">
                          <select value={emp.esso ?? ""}
                            onChange={(e) => updateEmployee(emp.id, "esso", e.target.value || null)}
                            className="bg-transparent text-sm focus:outline-none">
                            <option value="">—</option>
                            {ESSO_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </td>

                        <td className="px-3 py-2 tabular-nums text-xs">
                          {days !== null
                            ? <span className="font-medium text-foreground">{days}</span>
                            : <span className="opacity-40">—</span>}
                        </td>

                        <td className="px-3 py-2">
                          <select value={emp.iClass ?? ""}
                            onChange={(e) => updateEmployee(emp.id, "iClass", e.target.value || null)}
                            className="bg-transparent text-sm focus:outline-none">
                            <option value="">—</option>
                            {ICLASS_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </td>

                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => updateEmployee(emp.id, "armed", !emp.armed)}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                              emp.armed
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-muted text-muted-foreground"
                            }`}>
                            {emp.armed ? "Yes" : "No"}
                          </button>
                        </td>

                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {emp.status}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <button onClick={() => requestDelete(emp.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

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
