import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-6 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </div>
  );
}
