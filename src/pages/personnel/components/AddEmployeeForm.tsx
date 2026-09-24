// ─── pages/personnel/components/AddEmployeeForm.tsx ───────────────────────────
//
// Reads/writes `form` state and dispatches `addEmployee` straight from the
// store, same pattern as FilterBar — no props needed, so PersonnelPage
// doesn't have to thread form state through.

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEmployeeStore } from "@/stores/employee.store";
import {
  ESSO_OPTIONS,
  ICLASS_OPTIONS,
} from "@/types/employee";
import type { EssoBatch, IClass } from "@/types/employee";

export function AddEmployeeForm() {
  const form = useEmployeeStore((s) => s.form);
  const setForm = useEmployeeStore((s) => s.setForm);
  const formError = useEmployeeStore((s) => s.formError);
  const addEmployee = useEmployeeStore((s) => s.addEmployee);

  return (
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
            className={`h-8 w-full rounded-md border text-sm font-medium transition-colors ${form.armed
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
              }`}>
            {form.armed ? "Yes — Armed" : "No — Unarmed"}
          </button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional personnel note"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {formError && <p className="text-xs text-destructive">{formError}</p>}
      <Button size="sm" className="w-full" onClick={addEmployee}>Add to roster</Button>
    </Card>
  );
}