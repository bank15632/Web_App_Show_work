"use client";

import { FileText, Sparkles } from "lucide-react";

import { HoverHelp } from "@/components/portal/tracker/hover-help";
import type { TrackerArtifactRecord } from "@/lib/tracker/types";

export function WeeklyReportPanel({
  reports,
  onGenerate,
  onOpenReviewQueue,
}: {
  reports: TrackerArtifactRecord[];
  onGenerate: () => Promise<void>;
  onOpenReviewQueue: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="caption-editorial text-[0.7rem]">Weekly Report</p>
          <div className="mt-1 flex items-center gap-2">
            <h3 className="font-display text-3xl font-medium tracking-tight">
              Review-ready summaries
            </h3>
            <HoverHelp
              label="Weekly Report ใช้ยังไง"
              buttonLabel="Show weekly report help"
              body="หน้านี้ไม่ได้กรอกข้อมูลตรง ๆ แต่จะสรุปจาก task, status และข้อมูลล่าสุดของโปรเจ็กต์ กด Generate report เพื่อสร้าง proposal แล้วไป approve ต่อใน Review Queue เมื่อ approve แล้ว report ที่ผ่านจะกลับมาแสดงที่หน้านี้"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={onOpenReviewQueue}
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Open review queue
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-5 py-10 text-center text-muted-foreground">
            <p>No approved weekly reports yet.</p>
            <p className="mt-2 text-sm">
              Generate a report from the current project state, then approve it in Review Queue.
            </p>
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
