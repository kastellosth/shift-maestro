import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserPlus, AlertCircle } from "lucide-react";

type Props = {
  form: {
    surname: string;
    name: string;
    company: string;
    score: string;
  };

  setForm: React.Dispatch<
    React.SetStateAction<{
      surname: string;
      name: string;
      company: string;
      score: string;
    }>
  >;

  formError: string | null;
  addEmployee: () => void;
};

export default function EmployeeForm({
  form,
  setForm,
  formError,
  addEmployee,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Manually</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {/* surname */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Surname *
            </label>
            <Input
              value={form.surname}
              onChange={(e) =>
                setForm({ ...form, surname: e.target.value })
              }
              placeholder="Surname"
              className="h-8 text-sm"
            />
          </div>

          {/* name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Name
            </label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Name"
              className="h-8 text-sm"
            />
          </div>

          {/* company */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Company
            </label>
            <Input
              type="number"
              min={1}
              value={form.company}
              onChange={(e) =>
                setForm({ ...form, company: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>

          {/* score */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Score (blank = random)
            </label>
            <Input
              type="number"
              min={0}
              max={200}
              value={form.score}
              onChange={(e) =>
                setForm({ ...form, score: e.target.value })
              }
              placeholder="50–100"
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* error */}
        {formError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {formError}
          </div>
        )}

        {/* submit */}
        <Button size="sm" className="w-full" onClick={addEmployee}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </CardContent>
    </Card>
  );
}