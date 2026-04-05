import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CalendarDays, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Shift Scheduler</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/config")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">Schedule Management</h2>
          <p className="mt-2 text-muted-foreground">Select a module to manage shift assignments</p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg"
            onClick={() => navigate("/epiloxas")}
          >
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Επιλοχίας</CardTitle>
              <CardDescription>Guard shift scheduling with 3 groups — Guarding, AOT, KDA roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload employees, generate and manage guard duty shifts across multiple positions.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-lg"
            onClick={() => navigate("/2og")}
          >
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <CalendarDays className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">2ο Γραφείο</CardTitle>
              <CardDescription>Calendar-based duty scheduling with configurable rotation patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload names, set period & pattern, generate calendar schedules with drag & drop editing.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
