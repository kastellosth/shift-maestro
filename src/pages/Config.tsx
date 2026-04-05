import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Config = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift Configuration</CardTitle>
            <CardDescription>Default shift times for the Επιλοχίας module</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Group 1 Start</Label>
                <Input type="time" defaultValue="06:00" />
              </div>
              <div className="space-y-2">
                <Label>Group 2 Start</Label>
                <Input type="time" defaultValue="14:00" />
              </div>
              <div className="space-y-2">
                <Label>Group 3 Start</Label>
                <Input type="time" defaultValue="22:00" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
            <CardDescription>Positions per shift group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Guarding", "AOT", "KDA"].map((role) => (
              <div key={role} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="text-sm font-medium">{role}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">People per shift:</Label>
                  <Input type="number" defaultValue="2" className="w-16" min={1} max={10} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input placeholder="e.g. 1η Μοίρα" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </main>
    </div>
  );
};

export default Config;
