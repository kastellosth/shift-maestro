import { useState } from "react";
import { toast } from "sonner";
import type { Employee } from "../../../types";
import { getEmployees } from "../../../api/employee.api";

export type DBLoaderStep = "choose" | "company";

export interface UseDbLoaderReturn {
  dbModal: boolean;
  openDbModal: () => void;
  closeDbModal: () => void;

  dbStep: DBLoaderStep;
  setDbStep: (s: DBLoaderStep) => void;

  dbLoading: boolean;

  dbEmployees: Employee[];

  companyChecks: Record<number, Set<string>>;
  toggleCompanyAll: (company: number) => void;
  toggleCompanyEmployee: (company: number, id: string) => void;

  companyCollapsed: Record<number, boolean>;
  toggleCompanyCollapse: (company: number) => void;


  dbSearch: string;
  setDbSearch: (v: string) => void;

  dbCompanies: number[];
  dbSearchQ: string;
  totalSelected: number;

  handleLoadAllFromDB: (onSuccess: (employees: Employee[]) => void) => Promise<void>;
  handleOpenCompanyPicker: () => Promise<void>;
  handleConfirmCompanySelection: (onSuccess: (employees: Employee[]) => void) => void;
}

export function useDbLoader(): UseDbLoaderReturn {
  const [dbModal,   setDbModal]   = useState(false);
  const [dbStep,    setDbStep]    = useState<DBLoaderStep>("choose");
  const [dbLoading, setDbLoading] = useState(false);

  const [dbEmployees,      setDbEmployees]      = useState<Employee[]>([]);
  const [companyChecks,    setCompanyChecks]    = useState<Record<number, Set<string>>>({});
  const [companyCollapsed, setCompanyCollapsed] = useState<Record<number, boolean>>({});
  const [dbSearch,         setDbSearch]         = useState("");

  const openDbModal = () => {
    setDbStep("choose");
    setDbEmployees([]);
    setCompanyChecks({});
    setCompanyCollapsed({});
    setDbSearch("");
    setDbModal(true);
  };

  const closeDbModal = () => setDbModal(false);

  const handleLoadAllFromDB = async (onSuccess: (employees: Employee[]) => void) => {
    setDbLoading(true);
    try {
      const data = await getEmployees();
      onSuccess(data);
      setDbModal(false);
      toast.success(`${data.length} employees loaded from database`);
    } catch {
      toast.error("Failed to load from database");
    } finally {
      setDbLoading(false);
    }
  };

  // ── Fetch employees then advance to company picker step ───────────────────
  const handleOpenCompanyPicker = async () => {
    setDbLoading(true);
    try {
      const data = await getEmployees();
      setDbEmployees(data);

      const checks: Record<number, Set<string>> = {};
      [...new Set(data.map((e) => e.company))].forEach((c) => {
        checks[c] = new Set();
      });
      setCompanyChecks(checks);
      setDbStep("company");
    } catch {
      toast.error("Failed to load from database");
    } finally {
      setDbLoading(false);
    }
  };

  // ── Company checkbox helpers ──────────────────────────────────────────────
  const toggleCompanyAll = (company: number) => {
    const ids = dbEmployees.filter((e) => e.company === company).map((e) => e.id);
    setCompanyChecks((prev) => {
      const current    = prev[company] ?? new Set<string>();
      const allChecked = ids.every((id) => current.has(id));
      return { ...prev, [company]: new Set(allChecked ? [] : ids) };
    });
  };

  const toggleCompanyEmployee = (company: number, id: string) => {
    setCompanyChecks((prev) => {
      const next = new Set(prev[company] ?? []);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [company]: next };
    });
  };

  const toggleCompanyCollapse = (company: number) => {
    setCompanyCollapsed((prev) => ({ ...prev, [company]: !prev[company] }));
  };

  // ── Confirm selection and pass result to parent ───────────────────────────
  const handleConfirmCompanySelection = (onSuccess: (employees: Employee[]) => void) => {
    const allIds   = new Set(Object.values(companyChecks).flatMap((s) => [...s]));
    const selected = dbEmployees.filter((e) => allIds.has(e.id));
    if (!selected.length) {
      toast.error("No employees selected");
      return;
    }
    onSuccess(selected);
    setDbModal(false);
    toast.success(`${selected.length} employees loaded from database`);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const dbCompanies   = [...new Set(dbEmployees.map((e) => e.company))].sort((a, b) => a - b);
  const dbSearchQ     = dbSearch.toLowerCase();
  const totalSelected = Object.values(companyChecks).reduce((s, set) => s + set.size, 0);

  return {
    dbModal, openDbModal, closeDbModal,
    dbStep, setDbStep,
    dbLoading,
    dbEmployees,
    companyChecks, toggleCompanyAll, toggleCompanyEmployee,
    companyCollapsed, toggleCompanyCollapse,
    dbSearch, setDbSearch,
    dbCompanies, dbSearchQ, totalSelected,
    handleLoadAllFromDB, handleOpenCompanyPicker, handleConfirmCompanySelection,
  };
}