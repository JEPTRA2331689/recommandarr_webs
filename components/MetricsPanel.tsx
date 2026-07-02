"use client";

import { cn } from "@/lib/utils";
import type { EngineMetrics } from "@/types";

interface MetricsPanelProps {
  metrics: EngineMetrics | null;
  swipeCount: number;
}

/** Sidebar de métriques moteur (Pearson, MAE, biais, cold-start). */
export function MetricsPanel({ metrics, swipeCount }: MetricsPanelProps) {
  if (!metrics) return null;

  const progress = Math.min(100, (swipeCount / (metrics.swipesForReliableMetrics || 20)) * 100);

  const stats = [
    { label: "Pearson", value: metrics.pearsonCorrelation?.toFixed(3) ?? null, color: "text-secondary" },
    { label: "MAE",     value: metrics.mae?.toFixed(2) ?? null,                 color: "text-accent"    },
    {
      label: "Bias",
      value: metrics.bias != null
        ? (metrics.bias >= 0 ? "+" : "") + metrics.bias.toFixed(2)
        : null,
      color: "text-text-primary",
    },
  ];

  return (
    <div className="hidden lg:flex flex-col gap-3 w-56 flex-shrink-0 pt-2">
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">Engine</p>
        <div className="space-y-3">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-text-secondary">{label}</span>
              <span className={cn("font-semibold", color)}>{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-text-secondary">Cold start</span>
          <span className="font-medium text-text-primary">{swipeCount} swipes</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {metrics.swipesForReliableMetrics - swipeCount > 0
            ? `${metrics.swipesForReliableMetrics - swipeCount} more swipes`
            : "Reliable metrics ✓"}
        </p>
      </div>
    </div>
  );
}
