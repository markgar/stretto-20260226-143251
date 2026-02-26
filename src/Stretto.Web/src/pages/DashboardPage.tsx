import AppShell from '../components/AppShell';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-6">
        <h1 data-testid="dashboard-heading" className="text-2xl font-semibold">
          Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">Welcome to Stretto.</p>
      </div>
    </AppShell>
  );
}
