"use client";

import { HoverHelp } from "@/components/portal/tracker/hover-help";
import { domainTabs } from "@/lib/tracker/constants";
import type { TrackerDomainTab } from "@/lib/tracker/types";

const labels: Record<TrackerDomainTab, string> = {
  tasks: "Tasks",
  decisions: "Decisions",
};

const descriptions: Record<TrackerDomainTab, string> = {
  tasks: "View the main Kanban board, active tasks, sub-tasks, and the checklist for the current phase.",
  decisions: "Store approved project decisions that can still be edited or removed later when the plan changes.",
};

const helperBody = domainTabs
  .map((tab) => `${labels[tab]}: ${descriptions[tab]}`)
  .join("\n\n");

export function DomainTabs({
  activeTab,
  onChange,
}: {
  activeTab: TrackerDomainTab;
  onChange: (tab: TrackerDomainTab) => void;
}) {
  return (
    <div className="relative z-10 flex min-w-0 items-start gap-2">
      <div className="-mx-1 min-w-0 flex-1 overflow-x-auto pb-1">
        <div className="inline-flex min-w-max items-center gap-2 rounded-full border border-border bg-background p-1 px-1">
          {domainTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition-colors sm:text-sm ${
                activeTab === tab
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {labels[tab]}
            </button>
          ))}
        </div>
      </div>
      <HoverHelp
        label="Kanban board sections"
        buttonLabel="Show Kanban board guide"
        body={helperBody}
        className="shrink-0"
        panelClassName="left-auto right-0"
      />
    </div>
  );
}
