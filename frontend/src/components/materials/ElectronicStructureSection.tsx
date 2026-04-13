"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const BandStructureChart = dynamic(
  () => import("./BandStructureChart").then((m) => m.BandStructureChart),
  { ssr: false, loading: () => <ChartSkeleton label="Band Structure" /> }
);

const DosChart = dynamic(
  () => import("./DosChart").then((m) => m.DosChart),
  { ssr: false, loading: () => <ChartSkeleton label="Density of States" /> }
);

const PhaseDiagramChart = dynamic(
  () => import("./PhaseDiagramChart").then((m) => m.PhaseDiagramChart),
  { ssr: false, loading: () => <ChartSkeleton label="Phase Diagram" /> }
);

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold text-muted-foreground mb-3">{label}</div>
      <div className="h-64 bg-muted/30 rounded animate-pulse" />
    </div>
  );
}

interface Props {
  mpId: string;
  elements: string[];
  isMpMaterial: boolean;
}

type Tab = "band" | "dos" | "phase";

export function ElectronicStructureSection({ mpId, elements, isMpMaterial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("band");

  if (!isMpMaterial) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "band", label: "Band Structure" },
    { key: "dos", label: "DOS" },
    { key: "phase", label: "Phase Diagram" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground/80 mb-3">
        Electronic Structure
      </h2>
      <div className="flex gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === "band" && <BandStructureChart mpId={mpId} />}
        {activeTab === "dos" && <DosChart mpId={mpId} />}
        {activeTab === "phase" && <PhaseDiagramChart elements={elements} />}
      </div>
    </div>
  );
}
