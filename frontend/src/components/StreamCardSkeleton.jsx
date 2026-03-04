export default function StreamCardSkeleton() {
  return (
    <div className="group block space-y-3">
      <div className="block relative aspect-video rounded-lg overflow-hidden bg-neutral-800 animate-pulse border border-neutral-800" />
      <div className="flex gap-3">
        <div className="block w-10 h-10 rounded-full bg-neutral-800 animate-pulse flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 py-1">
          <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-neutral-800 rounded animate-pulse w-1/2" />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <div className="h-4 w-12 rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-4 w-16 rounded-full bg-neutral-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
