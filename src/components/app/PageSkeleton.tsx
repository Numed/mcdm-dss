export function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Завантаження">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 rounded-md bg-muted" />
        <div className="h-4 w-[28rem] max-w-full rounded-md bg-muted" />
      </div>
      <div className="h-40 rounded-xl border bg-card" />
      <div className="grid gap-6 xl:grid-cols-[7fr_5fr]">
        <div className="h-96 rounded-xl border bg-card" />
        <div className="h-96 rounded-xl border bg-card" />
      </div>
    </div>
  )
}
