/**
 * LoadingSkeleton
 *
 * Pulse skeleton for dashboard loading state.
 * Mirrors the visual shape of the real content so the transition is smooth.
 */

function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: 'hsl(220 20% 18%)' }}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 space-y-3"
      style={{
        backgroundColor: 'hsl(220 20% 14%)',
        border: '1px solid hsl(220 20% 20%)',
      }}
    >
      <SkeletonBlock className="h-8 w-8" />
      <SkeletonBlock className="h-7 w-16" />
      <SkeletonBlock className="h-4 w-24" />
    </div>
  );
}

export function IssueCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{
        backgroundColor: 'hsl(220 20% 14%)',
        border: '1px solid hsl(220 20% 20%)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-4/5" />
      <div className="flex items-center justify-between pt-1">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
      {/* Issue cards */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <IssueCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
