"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Activity, BarChart3, GitFork, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BandStructureChart = dynamic(
  () => import("./BandStructureChart").then((m) => m.BandStructureChart),
  { ssr: false, loading: () => <ChartLoading label="Band Structure" /> }
);

const DosChart = dynamic(
  () => import("./DosChart").then((m) => m.DosChart),
  { ssr: false, loading: () => <ChartLoading label="Density of States" /> }
);

const PhaseDiagramChart = dynamic(
  () => import("./PhaseDiagramChart").then((m) => m.PhaseDiagramChart),
  { ssr: false, loading: () => <ChartLoading label="Phase Diagram" /> }
);

function ChartLoading({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">Loading {label}...</span>
      </div>
      <div className="h-64 bg-gradient-to-b from-muted/40 to-muted/10 rounded-xl animate-pulse" />
    </div>
  );
}

interface Props {
  mpId: string;
  elements: string[];
  isMpMaterial: boolean;
}

type Tab = "band" | "dos" | "phase";

const TABS: { key: Tab; label: string; icon: typeof Activity; desc: string }[] = [
  { key: "band", label: "Band Structure", icon: Activity, desc: "Electronic bands along k-path" },
  { key: "dos", label: "DOS", icon: BarChart3, desc: "Density of states" },
  { key: "phase", label: "Phase Diagram", icon: GitFork, desc: "Thermodynamic stability" },
];

export function ElectronicStructureSection({ mpId, elements, isMpMaterial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("band");

  if (!isMpMaterial) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-foreground/80 mb-3">
        Electronic Structure
      </h2>

      {/* Tab selector — card-style pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{tab.label}</div>
                <div className="text-[10px] opacity-60 truncate hidden sm:block">{tab.desc}</div>
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active chart */}
      <div>
        {activeTab === "band" && <BandStructureChart mpId={mpId} />}
        {activeTab === "dos" && <DosChart mpId={mpId} />}
        {activeTab === "phase" && <PhaseDiagramChart elements={elements} />}
      </div>

      {/* MP link */}
      <div className="mt-2 text-center">
        <a
          href={`https://materialsproject.org/materials/${mpId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          View full data on Materials Project
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
