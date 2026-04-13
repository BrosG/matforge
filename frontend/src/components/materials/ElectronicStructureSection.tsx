"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const BandStructureChart = dynamic(
  () => import("./BandStructureChart").then((m) => m.BandStructureChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DosChart = dynamic(
  () => import("./DosChart").then((m) => m.DosChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PhaseDiagramChart = dynamic(
  () => import("./PhaseDiagramChart").then((m) => m.PhaseDiagramChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

interface Props {
  mpId: string;
  elements: string[];
  isMpMaterial: boolean;
}

type Tab = "band" | "dos" | "phase";

export function ElectronicStructureSection({ mpId, elements, isMpMaterial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("band");
  const [mpApiAvailable, setMpApiAvailable] = useState<boolean | null>(null);

  // Probe once whether mp-api is installed (check the band structure endpoint)
  useEffect(() => {
    if (!isMpMaterial) return;
    fetch(`${API_BASE}/electronic/bandstructure/${encodeURIComponent(mpId)}`)
      .then((r) => r.json())
      .then((d) => {
        // If `note` contains "not installed" → mp-api missing
        const unavailable = d.note?.includes("not installed") || d.detail?.includes("not installed");
        setMpApiAvailable(!unavailable);
      })
      .catch(() => setMpApiAvailable(false));
  }, [mpId, isMpMaterial]);

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

      {/* mp-api unavailable — show clean info panel instead of 3 error cards */}
      {mpApiAvailable === false ? (
        <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
          <p className="text-sm font-medium text-foreground mb-1">
            Interactive charts not yet available
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Band structure, DOS, and phase diagram require the Materials Project API.
          </p>
          <a
            href={`https://materialsproject.org/materials/${mpId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            View full electronic structure on Materials Project
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : (
        <>
          {/* Tabs — only shown when mp-api is known available or still probing */}
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
        </>
      )}
    </div>
  );
}
