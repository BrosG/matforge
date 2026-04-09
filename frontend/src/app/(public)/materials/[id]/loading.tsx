import { Skeleton } from "@/components/ui/skeleton";

export default function MaterialDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Breadcrumb skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Formula + badges */}
            <div className="flex flex-wrap items-start gap-4 mb-6">
              <Skeleton className="h-12 w-48 rounded-lg" />
              <div className="flex gap-2 mt-1">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>

            {/* External ID */}
            <div className="flex gap-3 mb-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>

            {/* Elements */}
            <div className="mb-6">
              <Skeleton className="h-4 w-16 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </div>

            {/* Properties table */}
            <div className="mb-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <div className="rounded-lg border overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Lattice parameters */}
            <div className="mb-6">
              <Skeleton className="h-4 w-36 mb-2" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="text-center p-3 bg-gray-50 rounded-xl border"
                  >
                    <Skeleton className="h-3 w-8 mx-auto mb-1" />
                    <Skeleton className="h-5 w-14 mx-auto mb-1" />
                    <Skeleton className="h-2 w-6 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: structure viewer placeholder */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="sticky top-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-96 lg:h-[28rem] w-full rounded-xl" />

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="text-center p-3 bg-white rounded-xl border shadow-sm"
                  >
                    <Skeleton className="h-2 w-12 mx-auto mb-1.5" />
                    <Skeleton className="h-5 w-10 mx-auto mb-1" />
                    <Skeleton className="h-2 w-6 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related materials skeleton */}
      <div className="border-t bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-5 bg-white/70 animate-pulse"
              >
                <Skeleton className="h-8 w-2/3 mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
