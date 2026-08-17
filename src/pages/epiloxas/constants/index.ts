// ─── constants/index.ts ───────────────────────────────────────────────────────
//
// WHY THIS FILE EXISTS:
//   Constants are values that are fixed at compile-time and never change while
//   the app is running. Keeping them here means:
//     • You find them instantly (no hunting through component files)
//     • They are never re-created on every render (no `const X = [...]` inside
//       a component body, which allocates a new array every time React renders)
//     • You can import them in tests without mounting any UI
//
//   Rule of thumb: if a value contains no React state and you'd feel comfortable
//   writing it in a plain .json file, it belongs here.

import type { Job, ShiftGroup, Employee } from "../../../types";

// ── Fallback job catalogue (used when the DB is unavailable) ─────────────────
export const DEFAULT_JOBS: Job[] = [
  { id: "j1", key: "ROOM_GUARD", label: "Room Guard",    difficulty: 3, requiredPeople: 1 },
  { id: "j2", key: "ARMORY",     label: "Armory",        difficulty: 5, requiredPeople: 2 },
  { id: "j3", key: "MOVING",     label: "Moving Patrol", difficulty: 7, requiredPeople: 2 },
];

// ── Fallback shift catalogue ──────────────────────────────────────────────────
export const DEFAULT_SHIFTS: ShiftGroup[] = [
  { id: "s1", name: "A", label: "06:00–09:00, 15:00–18:00, 00:00–02:00", difficulty: 1 },
  { id: "s2", name: "B", label: "09:00–12:00, 18:00–21:00, 02:00–04:00", difficulty: 2 },
  { id: "s3", name: "C", label: "12:00–15:00, 21:00–24:00, 04:00–06:00", difficulty: 3 },
];

// ── Demo employee roster (Greek names, realistic companies) ───────────────────

export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: "1", name: "Γιώργος", surname: "Παπαδόπουλος", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "2", name: "Αλέξανδρος", surname: "Κωνσταντίνου", company: 2, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "3", name: "Δημήτριος", surname: "Νικολάου", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "4", name: "Κωνσταντίνος", surname: "Αθανασίου", company: 3, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "5", name: "Ευάγγελος", surname: "Δημητρίου", company: 2, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "6", name: "Μιχάλης", surname: "Γεωργίου", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "7", name: "Παναγιώτης", surname: "Ιωάννου", company: 3, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "8", name: "Σταύρος", surname: "Βασιλείου", company: 2, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "9", name: "Νίκος", surname: "Χριστοδούλου", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "10", name: "Θανάσης", surname: "Μιχαηλίδης", company: 3, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "11", name: "Λάμπρος", surname: "Παναγιώτου", company: 2, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "12", name: "Φώτης", surname: "Σωτηρίου", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "13", name: "Ρένα", surname: "Αλεξίου", company: 3, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "14", name: "Ιωάννης", surname: "Μαρκόπουλος", company: 2, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "15", name: "Βασίλης", surname: "Καραγιάννης", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "16", name: "Χρήστος", surname: "Πετρίδης", company: 3, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "17", name: "Ωκεανός", surname: "Ανδρέου", company: 2, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
  {
    id: "18", name: "Ηλίας", surname: "Λαζαρίδης", company: 1, score: 0,
    esso: "Α",
    essoEntryDate: "",
    iClass: "I1",
    armed: false,
    notes: ""
  },
];

// ── API base URL ──────────────────────────────────────────────────────────────
//
// Centralising the base URL here means you change it in one place when you
// move from localhost to staging/production. In a real project this would
// come from an environment variable (import.meta.env.VITE_API_URL).

// ── Config persistence ────────────────────────────────────────────────────────
//
// Jobs and shifts can be customised in the Config page and are saved to
// localStora
