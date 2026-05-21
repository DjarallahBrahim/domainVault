export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen animate-pulse">
      <aside className="hidden md:block md:w-64 border-r border-border bg-bg-surface p-4">
        <div className="h-5 w-24 bg-bg-elevated rounded mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-bg-elevated rounded" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="h-8 w-48 bg-bg-elevated rounded mb-4" />
        <div className="h-4 w-96 bg-bg-elevated rounded" />
      </main>
    </div>
  );
}
