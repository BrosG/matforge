import { Suspense } from "react";
import dynamic from "next/dynamic";

const MaterialBuilder = dynamic(
  () => import("@/components/material-builder/MaterialBuilder"),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-blue-500/40 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-blue-500/60 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            Loading Material Builder...
          </p>
        </div>
      </div>
    ),
  }
);

export default function MaterialBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-gray-50 dark:bg-gray-950" />}>
      <MaterialBuilder />
    </Suspense>
  );
}
