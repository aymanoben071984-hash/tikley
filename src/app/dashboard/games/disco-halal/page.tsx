import { DiscoHalalExperience } from "@/components/DiscoHalalExperience";

export default function DiscoHalalDashboardPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Disco Halal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tikley LIVE dance floor · preview and OBS browser source</p>
        </div>
        <DiscoHalalExperience preview />
      </div>
    </main>
  );
}
