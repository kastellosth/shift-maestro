// ─── Epiloxas.tsx (page component) ───────────────────────────────────────────
//
// Orchestration only. Wires hooks ↔ components, holds shared state.
// Business logic lives in hooks/; rendering lives in components/.

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { API_BASE } from "../../lib/api";
import type {
  Employee,
  Job,
  ShiftGroup,
  PinnedAssignment,
} from "../../types";

import { useDbLoader } from "./hooks/useDbLoader";
import { useScheduler } from "./hooks/useScheduler";

import { LoadEmployeesCard } from "./components/employees/LoadEmployeesCard";
import { EmployeeTable } from "./components/employees/EmployeeTable";
import { ScheduleTable } from "./components/schedule/ScheduleTable";
import { ScheduleStatsCard } from "./components/schedule/ScheduleStatsCard";
import { NoteModal } from "./components/modals/NoteModal";
import { DbLoaderModal } from "./components/modals/DbLoaderModal";

function todayInputValue(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const Epiloxas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [targetDate, setTargetDate] =
    useState(todayInputValue);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pins, setPins] = useState<
    Record<string, PinnedAssignment>
  >({});
  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [shifts, setShifts] =
    useState<ShiftGroup[]>([]);

  const [configLoading, setConfigLoading] =
    useState(true);
  // noteModal carries the empId so the modal can read the current employee
  const [noteModal, setNoteModal] = useState<{ empId: string; text: string } | null>(null);

  const scheduler =
    useScheduler(
      employees,
      jobs,
      shifts,
      pins,
      targetDate
    );
  const dbLoader = useDbLoader();


  useEffect(() => {
    const loadSchedulingConfig = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/config`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load config: ${response.status}`
          );
        }

        const data = await response.json();

        setJobs(data.jobs);
        setShifts(data.shifts);
      } catch (error) {
        console.error(
          "Failed to load scheduling config:",
          error
        );

        toast.error(
          "Could not load scheduling configuration"
        );
      } finally {
        setConfigLoading(false);
      }
    };

    loadSchedulingConfig();
  }, []);
  // ── Accept names forwarded via router state ───────────────────────────────
  useEffect(() => {
    const state = location.state as { names?: string[] } | null;

    if (!state?.names?.length) return;

    const imported: Employee[] = state.names.map((n, i) => {
      const parts = n.trim().split(" ");

      return {
        id: String(i + 1),
        surname: parts[0] ?? n,
        name: parts.slice(1).join(" ") || "",
        company: 1,
        score: 0,

        esso: null,
        essoEntryDate: null,
        iClass: null,
        armed: false,
        notes: null,
      };
    });

    setEmployees(imported);

    toast.success(
      `${imported.length} names imported from 2ο Γραφείο`
    );

    window.history.replaceState(
      {},
      document.title
    );
  }, [location.state]);

  // ── Note + pin handler ────────────────────────────────────────────────────
  // NoteModal now passes back both text AND the optional pin.
  const handleNoteSave = (
    empId: string,
    text: string,
    pinned: PinnedAssignment | null
  ) => {
    // Employee note is employee data.
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === empId
          ? {
            ...employee,
            notes: text.trim() || null,
          }
          : employee
      )
    );

    // Pin is schedule-editing state.
    setPins((prev) => {
      const next = { ...prev };

      if (pinned) {
        next[empId] = pinned;
      } else {
        delete next[empId];
      }

      return next;
    });

    setNoteModal(null);

    toast.success("Saved");
  };

  const handleLoadEmployees = (next: Employee[]) => {
    setEmployees(next);
    scheduler.resetSchedule();
  };

  const pinnedEmployee = noteModal ? employees.find((e) => e.id === noteModal.empId) : null;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {dbLoader.dbModal && (
        <DbLoaderModal
          dbStep={dbLoader.dbStep} setDbStep={dbLoader.setDbStep}
          dbLoading={dbLoader.dbLoading} onClose={dbLoader.closeDbModal}
          onLoadAll={() => dbLoader.handleLoadAllFromDB(handleLoadEmployees)}
          onOpenCompanyPicker={dbLoader.handleOpenCompanyPicker}
          dbEmployees={dbLoader.dbEmployees}
          dbCompanies={dbLoader.dbCompanies}
          dbSearch={dbLoader.dbSearch} dbSearchQ={dbLoader.dbSearchQ}
          setDbSearch={dbLoader.setDbSearch}
          companyChecks={dbLoader.companyChecks}
          companyCollapsed={dbLoader.companyCollapsed}
          totalSelected={dbLoader.totalSelected}
          toggleCompanyAll={dbLoader.toggleCompanyAll}
          toggleCompanyEmployee={dbLoader.toggleCompanyEmployee}
          toggleCompanyCollapse={dbLoader.toggleCompanyCollapse}
          onConfirmSelection={() => dbLoader.handleConfirmCompanySelection(handleLoadEmployees)}
        />
      )}

      {noteModal && pinnedEmployee && (
        <NoteModal
          employee={pinnedEmployee}
          initialText={noteModal.text}
          jobs={jobs}
          shifts={shifts}
          onSave={handleNoteSave}
          onClose={() => setNoteModal(null)}
          initialPin={pins[pinnedEmployee.id] ?? null}

        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Επιλοχίας — Guard Shifts</h1>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => navigate("/personnel")}>
              <Users className="mr-2 h-4 w-4" />
              Manage Personnel
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="container mx-auto space-y-6 px-6 py-8">

        <LoadEmployeesCard
          employeeCount={employees.length}
          onLoad={handleLoadEmployees}
          onOpenDbModal={dbLoader.openDbModal}
        />

        {employees.length > 0 && (
          <EmployeeTable
            employees={employees}
            onNoteClick={(empId, text) => setNoteModal({ empId, text })}
            headerAction={
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value);
                    scheduler.resetSchedule();
                  }}
                  className="h-9 w-40"
                />

                <Button
                  onClick={scheduler.generateSchedule}
                  size="sm"
                  disabled={configLoading}
                >
                  <Sparkles className="mr-2 h-4 w-4" />

                  {configLoading
                    ? "Loading Config..."
                    : "Generate Schedule"}
                </Button>
              </div>
            }
          />
        )}

        {scheduler.schedule && (
          <>
            <ScheduleTable
              schedule={scheduler.schedule}
              employees={employees}
              jobs={jobs}
              shifts={shifts}
              onDragStart={scheduler.handleDragStart}
              onDrop={scheduler.handleDrop}
              pins={pins}
              onFinalize={scheduler.finalizeSchedule}
              isFinalizing={scheduler.isFinalizing}
            />
            <ScheduleStatsCard
              schedule={scheduler.schedule}
              employees={employees}
              jobs={jobs}
              shifts={shifts}
            />
          </>
        )}

      </main>
    </div>
  );
};

export default Epiloxas;
