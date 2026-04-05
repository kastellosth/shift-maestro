import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Download, AlertTriangle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  rank?: string;
}

interface ShiftGroup {
  name: string;
  guarding: string[];
  aot: string[];
  kda: string[];
}

const DEMO_EMPLOYEES: Employee[] = [
  { id: "1", name: "Παπαδόπουλος Γ.", rank: "ΛΟΧΙΑΣ" },
  { id: "2", name: "Κωνσταντίνου Α.", rank: "ΔΕΚΑΝΕΑΣ" },
  { id: "3", name: "Νικολάου Δ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "4", name: "Αθανασίου Κ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "5", name: "Δημητρίου Ε.", rank: "ΔΕΚΑΝΕΑΣ" },
  { id: "6", name: "Γεωργίου Μ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "7", name: "Ιωάννου Π.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "8", name: "Βασιλείου Σ.", rank: "ΛΟΧΙΑΣ" },
  { id: "9", name: "Χριστοδούλου Ν.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "10", name: "Μιχαηλίδης Θ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "11", name: "Παναγιώτου Λ.", rank: "ΔΕΚΑΝΕΑΣ" },
  { id: "12", name: "Σωτηρίου Φ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "13", name: "Αλεξίου Ρ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "14", name: "Μαρκόπουλος Ι.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "15", name: "Καραγιάννης Β.", rank: "ΔΕΚΑΝΕΑΣ" },
  { id: "16", name: "Πετρίδης Χ.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "17", name: "Ανδρέου Ω.", rank: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: "18", name: "Λαζαρίδης Η.", rank: "ΛΟΧΙΑΣ" },
];

const Epiloxas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedule, setSchedule] = useState<ShiftGroup[] | null>(null);
  const [dragItem, setDragItem] = useState<{ group: number; role: string; index: number } | null>(null);

  // Accept names from 2oG page via navigation state
  useEffect(() => {
    const state = location.state as { names?: string[] } | null;
    if (state?.names && state.names.length > 0) {
      const imported: Employee[] = state.names.map((name, i) => ({
        id: String(i + 1),
        name,
        rank: "",
      }));
      setEmployees(imported);
      toast.success(`${imported.length} names imported from 2ο Γραφείο`);
      // Clear state so it doesn't re-import on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const parsed: Employee[] = lines.slice(1).map((line, i) => {
        const parts = line.split(",").map((p) => p.trim());
        return { id: String(i + 1), name: parts[0] || "", rank: parts[1] || "" };
      });
      setEmployees(parsed);
      setSchedule(null);
      toast.success(`${parsed.length} employees loaded`);
    };
    reader.readAsText(file);
  }, []);

  const handleLoadDemo = () => {
    setEmployees(DEMO_EMPLOYEES);
    setSchedule(null);
    toast.success("Demo data loaded");
  };

  const generateSchedule = () => {
    if (employees.length < 18) {
      toast.error("Need at least 18 employees for 3 full groups");
      return;
    }
    const shuffled = [...employees].sort(() => Math.random() - 0.5);
    const groups: ShiftGroup[] = [
      { name: "Group 1 — 06:00-14:00", guarding: [shuffled[0].name, shuffled[1].name], aot: [shuffled[2].name, shuffled[3].name], kda: [shuffled[4].name, shuffled[5].name] },
      { name: "Group 2 — 14:00-22:00", guarding: [shuffled[6].name, shuffled[7].name], aot: [shuffled[8].name, shuffled[9].name], kda: [shuffled[10].name, shuffled[11].name] },
      { name: "Group 3 — 22:00-06:00", guarding: [shuffled[12].name, shuffled[13].name], aot: [shuffled[14].name, shuffled[15].name], kda: [shuffled[16].name, shuffled[17].name] },
    ];
    setSchedule(groups);
    toast.success("Schedule generated!");
  };

  const handleDragStart = (group: number, role: string, index: number) => {
    setDragItem({ group, role, index });
  };

  const handleDrop = (targetGroup: number, targetRole: string, targetIndex: number) => {
    if (!dragItem || !schedule) return;
    const newSchedule = schedule.map((g) => ({
      ...g,
      guarding: [...g.guarding],
      aot: [...g.aot],
      kda: [...g.kda],
    }));

    const getArr = (g: ShiftGroup, r: string) => r === "guarding" ? g.guarding : r === "aot" ? g.aot : g.kda;
    const srcArr = getArr(newSchedule[dragItem.group], dragItem.role);
    const tgtArr = getArr(newSchedule[targetGroup], targetRole);
    const temp = srcArr[dragItem.index];
    srcArr[dragItem.index] = tgtArr[targetIndex];
    tgtArr[targetIndex] = temp;

    setSchedule(newSchedule);
    setDragItem(null);
    toast.info("Assignment swapped");
  };

  const downloadCSV = () => {
    if (!schedule) return;
    let csv = "Group,Role,Person 1,Person 2\n";
    schedule.forEach((g) => {
      csv += `${g.name},Guarding,${g.guarding[0]},${g.guarding[1]}\n`;
      csv += `${g.name},AOT,${g.aot[0]},${g.aot[1]}\n`;
      csv += `${g.name},KDA,${g.kda[0]},${g.kda[1]}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule_epiloxas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRole = (groupIdx: number, role: string, people: string[]) => (
    <>
      {people.map((person, i) => (
        <TableCell
          key={i}
          draggable
          onDragStart={() => handleDragStart(groupIdx, role, i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(groupIdx, role, i)}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2 rounded-md border border-transparent bg-muted px-2 py-1.5 text-sm hover:border-primary/30">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            {person}
          </div>
        </TableCell>
      ))}
    </>
  );

  // Check for duplicate names across groups
  const findConflicts = (): string[] => {
    if (!schedule) return [];
    const all = schedule.flatMap((g) => [...g.guarding, ...g.aot, ...g.kda]);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    all.forEach((n) => { if (seen.has(n)) dupes.add(n); seen.add(n); });
    return Array.from(dupes);
  };
  const conflicts = findConflicts();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Επιλοχίας — Guard Shifts</h1>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-6 py-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Employees</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Upload className="h-4 w-4" />
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            <Button variant="outline" size="sm" onClick={handleLoadDemo}>
              Load Demo Data
            </Button>
            {employees.length > 0 && (
              <Badge variant="secondary">{employees.length} employees</Badge>
            )}
          </CardContent>
        </Card>

        {/* Employee Table */}
        {employees.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Employee List</CardTitle>
              <Button onClick={generateSchedule} size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Rank</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp, i) => (
                      <TableRow key={emp.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{emp.rank || "—"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Schedule */}
        {schedule && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Generated Schedule</CardTitle>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {conflicts.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Conflict: {conflicts.join(", ")} appears in multiple slots
                </div>
              )}
              <p className="text-xs text-muted-foreground">Drag & drop names between cells to swap assignments.</p>
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift Group</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Person 1</TableHead>
                      <TableHead>Person 2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((group, gi) => (
                      <>
                        <TableRow key={`${gi}-g`} className="bg-primary/5">
                          <TableCell className="font-semibold text-primary" rowSpan={1}>{group.name}</TableCell>
                          <TableCell className="font-medium">Guarding</TableCell>
                          {renderRole(gi, "guarding", group.guarding)}
                        </TableRow>
                        <TableRow key={`${gi}-a`}>
                          <TableCell />
                          <TableCell className="font-medium">AOT</TableCell>
                          {renderRole(gi, "aot", group.aot)}
                        </TableRow>
                        <TableRow key={`${gi}-k`}>
                          <TableCell />
                          <TableCell className="font-medium">KDA</TableCell>
                          {renderRole(gi, "kda", group.kda)}
                        </TableRow>
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Epiloxas;
