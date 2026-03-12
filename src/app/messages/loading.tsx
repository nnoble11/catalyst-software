export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-4 sm:px-8">
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <div className="mb-6 h-9 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/30" />
          ))}
        </div>
      </main>
    </div>
  );
}
