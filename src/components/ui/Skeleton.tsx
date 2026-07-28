export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[var(--radius)] border border-slate-200/70 p-5 space-y-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}
