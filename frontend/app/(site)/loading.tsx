export default function Loading() {
  return (
    <div className="shell py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading stories</span>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-video w-full animate-pulse rounded-lg bg-wash" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-16 w-24 shrink-0 animate-pulse rounded bg-wash" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-full animate-pulse rounded bg-wash" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-wash" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
