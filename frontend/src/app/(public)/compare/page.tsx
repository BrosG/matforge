import { Suspense } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MaterialComparator } from "@/components/materials/MaterialComparator";

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<ComparatorSkeleton />}>
            <MaterialComparator />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ComparatorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-muted rounded animate-pulse" />
      <div className="h-12 w-full bg-muted rounded animate-pulse" />
      <div className="h-96 w-full bg-muted rounded animate-pulse" />
    </div>
  );
}
