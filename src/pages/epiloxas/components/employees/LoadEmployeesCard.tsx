import { Upload, Users } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "../../../../types";
import { generateLocalId } from "../../../../lib/utils";
import { DEMO_EMPLOYEES } from "../../constants";


interface LoadEmployeesCardProps {
  employeeCount: number;
  onLoad: (employees: Employee[]) => void;
  onOpenDbModal: () => void;
}

export function LoadEmployeesCard({ employeeCount, onLoad, onOpenDbModal }: LoadEmployeesCardProps) {
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text  = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
    const parsed: Employee[] = lines.slice(1).map((line) => {
  const p = line.split(",").map((x) => x.trim());

  return {
    id: generateLocalId("csv"),
    surname: p[0] || "",
    name: p[1] || "",
    company: parseInt(p[2] ?? "1", 10) || 1,
    score: 0,

    esso: null,
    essoEntryDate: null,
    iClass: null,
    armed: false,
    notes: null,
  };
});
      onLoad(parsed);
      toast.success(`${parsed.length} employees loaded`);
    };
    reader.readAsText(file);
  }, [onLoad]);

  const handleLoadDemo = () => {
    onLoad(DEMO_EMPLOYEES);
    toast.success("Demo data loaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Load Employees</CardTitle>
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

        <Button variant="outline" size="sm" onClick={onOpenDbModal}>
          <Users className="mr-2 h-4 w-4" />
          Load from Database
        </Button>

        {employeeCount > 0 && (
          <Badge variant="secondary">{employeeCount} employees</Badge>
        )}

      </CardContent>
    </Card>
  );
}