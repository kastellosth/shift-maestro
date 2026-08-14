// ─── Config.tsx ───────────────────────────────────────────────────────────────
//
// Settings page for the Επιλοχίας module.
//
// Sections:
//   1. Shift Groups  — add / delete / edit name, label, difficulty
//   2. Jobs          — add / delete / edit label, difficulty, requiredPeople
//   3. General       — organisation name (saved to localStorage)
//
// A sticky footer always shows the live total of people required per schedule
// generation: shifts × Σ(job.requiredPeople).
//
// All changes are written to localStorage via saveConfig() so Epiloxas.tsx
// picks them up on the next mount (it calls loadConfig() in useState initialiser).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Save, Users, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Job, ShiftGroup } from "../types";
import { DEFAULT_JOBS, DEFAULT_SHIFTS, saveConfig, loadConfig } from "./epiloxas/constants";

// ── Tiny id generator (no uuid dep needed) ────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ── Component ─────────────────────────────────────────────────────────────────

const Config = () => {
  const navigate = useNavigate();

  // Initialise from localStorage (or defaults if first visit)
  const saved = loadConfig();
  const [jobs,   setJobs]   = useState<Job[]>(saved.jobs);
  const [shifts, setShifts] = useState<ShiftGroup[]>(saved.shifts);
  const [orgName, setOrgName] = useState<string>(
    () => localStorage.getItem("epiloxas_orgname") ?? "",
  );

  // ── Derived totals ─────────────────────────────────────────────────────────
  const peoplePerShift  = jobs.reduce((s, j) => s + j.requiredPeople, 0);
  const totalPeople     = shifts.length * peoplePerShift;

  // ── Job helpers ────────────────────────────────────────────────────────────
  const addJob = () => {
    const key = `JOB_${uid().toUpperCase()}`;
    setJobs((prev) => [
      ...prev,
      { id: uid(), key, label: "New Job", difficulty: 1, requiredPeople: 1 },
    ]);
  };

  const updateJob = <K extends keyof Job>(id: string, field: K, value: Job[K]) => {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, [field]: value } : j));
  };

  const deleteJob = (id: string) => {
    if (jobs.length <= 1) { toast.error("Need at least one job"); return; }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // ── Shift helpers ──────────────────────────────────────────────────────────
  const addShift = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const usedNames = new Set(shifts.map((s) => s.name));
    const nextName = letters.split("").find((l) => !usedNames.has(l)) ?? `S${shifts.length + 1}`;
    setShifts((prev) => [
      ...prev,
      { id: uid(), name: nextName, label: "00:00–08:00", difficulty: prev.length + 1 },
    ]);
  };

  const updateShift = <K extends keyof ShiftGroup>(id: string, field: K, value: ShiftGroup[K]) => {
    setShifts((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteShift = (id: string) => {
    if (shifts.length <= 1) { toast.error("Need at least one shift"); return; }
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    // Validate: every job must have a non-empty label
    if (jobs.some((j) => !j.label.trim())) {
      toast.error("All jobs must have a label");
      return;
    }
    if (shifts.some((s) => !s.name.trim())) {
      toast.error("All shifts must have a name");
      return;
    }
    saveConfig(jobs, shifts);
    localStorage.setItem("epiloxas_orgname", orgName);
    toast.success("Settings saved — reload Epiloxas to apply");
  };

  const handleReset = () => {
    setJobs(DEFAULT_JOBS);
    setShifts(DEFAULT_SHIFTS);
    toast.info("Reset to defaults (not yet saved)");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <Button variant="ghost" size="sm" className="ml-auto text-xs text-muted-foreground" onClick={handleReset}>
            Reset to defaults
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-6 px-6 py-8">

        {/* ── Shift Groups ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Shift Groups</CardTitle>
              <CardDescription>Each shift multiplies the difficulty of all jobs assigned to it.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addShift} className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Shift
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="grid grid-cols-[48px_1fr_2fr_72px_36px] items-center gap-2 rounded-lg border px-3 py-2.5"
              >
                {/* Name (single letter) */}
                <div className="space-y-0.5">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input
                    value={shift.name}
                    onChange={(e) => updateShift(shift.id, "name", e.target.value)}
                    className="h-7 px-2 text-sm font-semibold text-center"
                    maxLength={3}
                  />
                </div>

                {/* Label / time range */}
                <div className="space-y-0.5">
                  <label className="text-xs text-muted-foreground">Time label</label>
                  <Input
                    value={shift.label}
                    onChange={(e) => updateShift(shift.id, "label", e.target.value)}
                    className="h-7 px-2 text-xs"
                    placeholder="e.g. 06:00–14:00"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-0.5">
                  <label className="text-xs text-muted-foreground">Difficulty ×</label>
                  <Input
                    type="number"
                    min={1} max={10}
                    value={shift.difficulty}
                    onChange={(e) => updateShift(shift.id, "difficulty", Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 px-2 text-sm"
                  />
                </div>

                {/* Delete */}
                <div className="flex items-end justify-end pb-0.5 col-start-5">
                  <button
                    onClick={() => deleteShift(shift.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete shift"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {shifts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No shifts — add one above.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Jobs ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Jobs</CardTitle>
              <CardDescription>Each job is assigned to every shift. Total people = shifts × Σ(people/job).</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addJob} className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Job
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-[1fr_72px_80px_36px] items-center gap-2 rounded-lg border px-3 py-2.5"
              >
                {/* Label */}
                <div className="space-y-0.5">
                  <label className="text-xs text-muted-foreground">Label</label>
                  <Input
                    value={job.label}
                    onChange={(e) => updateJob(job.id, "label", e.target.value)}
                    className="h-7 px-2 text-sm"
                    placeholder="Job name"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-0.5">
                  <label className="text-xs text-muted-foreground">Difficulty</label>
                  <Input
                    type="number"
                    min={1} max={20}
                    value={job.difficulty}
                    onChange={(e) => updateJob(job.id, "difficulty", Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 px-2 text-sm"
                  />
                </div>

                {/* Required people */}
                <div className="space-y-0.5">
                  <label className="text-xs text-muted-foreground">People/shift</label>
                  <Input
                    type="number"
                    min={1} max={10}
                    value={job.requiredPeople}
                    onChange={(e) => updateJob(job.id, "requiredPeople", Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 px-2 text-sm"
                  />
                </div>

                {/* Delete */}
                <div className="flex items-end justify-end pb-0.5">
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No jobs — add one above.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── General ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Organisation Name</Label>
              <Input
                placeholder="e.g. 1η Μοίρα"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

      </main>

      {/* ── Sticky footer — live total ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm px-6 py-3 shadow-lg">
        <div className="container mx-auto max-w-2xl flex items-center justify-between gap-4">

          {/* Live totals */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-2xl font-bold tabular-nums text-foreground">{totalPeople}</span>
                <span className="ml-1.5 text-sm text-muted-foreground">people required</span>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>{shifts.length} shift{shifts.length !== 1 ? "s" : ""} × {peoplePerShift} people/shift</div>
              <div className="opacity-70">
                {jobs.map((j) => `${j.label} (${j.requiredPeople})`).join(" + ")}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Config;
