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
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 px-1">
        {(Object.keys(savedViewLabels) as TrackerSavedView[]).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onChange(view)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition-all sm:text-sm ${
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
    </div>
  );
}
