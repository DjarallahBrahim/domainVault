export default function AuthLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-40 rounded bg-bg-elevated" />
        <div className="mt-2.5 h-4 w-56 rounded bg-bg-elevated" />
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-12 rounded bg-bg-elevated" />
          <div className="h-10 w-full rounded-md bg-bg-elevated" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-bg-elevated" />
          <div className="h-10 w-full rounded-md bg-bg-elevated" />
        </div>
        <div className="h-11 w-full rounded-md bg-bg-elevated" />
      </div>
    </div>
  );
}
