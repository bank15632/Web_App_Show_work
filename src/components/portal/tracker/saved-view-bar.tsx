"use client";

import { savedViewLabels } from "@/lib/tracker/constants";
import type { TrackerSavedView } from "@/lib/tracker/types";

export function SavedViewBar({
  activeView,
  counts,
  onChange,
}: {
  activeView: TrackerSavedView;
  counts: Record<TrackerSavedView, number>;
  onChange: (view: TrackerSavedView) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(savedViewLabels) as TrackerSavedView[]).map((view) => (
        <button
          key={view}
          type="button"
          onClick={() => onChange(view)}
          className={`rounded-full border px-4 py-2 text-sm transition-all ${
            activeView === view
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {savedViewLabels[view]}{" "}
          <span className={activeView === view ? "text-background/80" : "text-muted-foreground"}>
            {counts[view]}
          </span>
        </button>
      ))}
    </div>
  );
}
