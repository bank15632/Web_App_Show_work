"use client";

import { domainTabs } from "@/lib/tracker/constants";
import type { TrackerDomainTab } from "@/lib/tracker/types";

const labels: Record<TrackerDomainTab, string> = {
  tasks: "Tasks",
  decisions: "Decisions",
  revision_log: "Revision Log",
  weekly_report: "Weekly Report",
  review_queue: "Review Queue",
};

export function DomainTabs({
  activeTab,
  onChange,
}: {
  activeTab: TrackerDomainTab;
  onChange: (tab: TrackerDomainTab) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-border bg-background p-1">
      {domainTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            activeTab === tab
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
