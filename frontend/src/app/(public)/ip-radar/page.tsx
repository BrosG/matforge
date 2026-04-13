import { Suspense } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { IPRadar } from "@/components/ip-radar/IPRadar";

export default function IPRadarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />
      <main className="pt-16">
        <Suspense fallback={<IPRadarSkeleton />}>
          <IPRadar />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function IPRadarSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pt-24 pb-16">
      <div className="h-10 w-80 bg-muted rounded animate-pulse mx-auto" />
      <div className="h-6 w-96 bg-muted rounded animate-pulse mx-auto" />
      <div className="h-14 w-full max-w-2xl bg-muted rounded-xl animate-pulse mx-auto" />
      <div className="h-96 w-full bg-muted rounded-xl animate-pulse" />
    </div>
  );
}
