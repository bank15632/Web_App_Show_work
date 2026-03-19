"use client";

import { FileText, Sparkles } from "lucide-react";

import type { TrackerArtifactRecord } from "@/lib/tracker/types";

export function WeeklyReportPanel({
  reports,
  onGenerate,
}: {
  reports: TrackerArtifactRecord[];
  onGenerate: () => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="caption-editorial text-[0.7rem]">Weekly Report</p>
          <h3 className="mt-1 font-display text-3xl font-medium tracking-tight">
            Review-ready summaries
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            void onGenerate();
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Sparkles className="size-4" />
          Generate report
        </button>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-5 py-10 text-center text-muted-foreground">
            No approved weekly reports yet.
          </div>
        ) : null}
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-[1.5rem] border border-border bg-background p-5"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
                <FileText className="size-4" />
              </span>
              <div>
                <h4 className="text-base font-medium">{report.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(report.createdAt))}
                </p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {report.extractedSummary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
