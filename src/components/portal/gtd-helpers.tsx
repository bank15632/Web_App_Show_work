"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import {
  bucketLabels,
  bucketOrder,
  reviewSteps,
  type GtdItem,
  type GtdPriority,
  type WeeklyReviewState,
} from "@/lib/gtd-system";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

export function MetricCard({ icon, label, value, body }: { icon: ReactNode; label: string; value: number; body: string }) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-[0.68rem]">{label}</span>
      </div>
      <p className="mt-3 font-display text-4xl font-medium">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

export function QuickProcessButton({
  label,
  onClick,
  disabled = false,
  isPending = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {isPending ? `${label}...` : label}
    </button>
  );
}

export function LoadingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
      <LoaderCircle className="size-3.5 animate-spin" />
      {label}
    </span>
  );
}

export function OverlayDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 p-4"
      onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="caption-editorial">GTD Bridge</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function sortItems(a: GtdItem, b: GtdItem) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const order: Record<GtdPriority, number> = { high: 0, medium: 1, low: 2 };
  if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
  if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function sortArchivedItems(a: GtdItem, b: GtdItem) {
  const aDoneAt = a.doneAt ? new Date(a.doneAt).getTime() : 0;
  const bDoneAt = b.doneAt ? new Date(b.doneAt).getTime() : 0;
  if (aDoneAt !== bDoneAt) return bDoneAt - aDoneAt;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function buildWeeklyReviewBrief(items: GtdItem[], review: WeeklyReviewState) {
  const lines = [
    "You are reviewing my GTD workspace for an AEC team.",
    "Use only the data below and answer in Thai.",
    "",
    "# Weekly review progress",
    `Completed steps: ${reviewSteps.filter((step) => review.steps[step.id]).length}/${reviewSteps.length}`,
    `Weekly focus: ${review.focus || "-"}`,
    `Review notes: ${review.notes || "-"}`,
    "",
    "# Open items by bucket",
  ];

  bucketOrder.forEach((bucket) => {
    const entries = items.filter((item) => item.bucket === bucket && !item.done);
    if (!entries.length) return;
    lines.push(`## ${bucketLabels[bucket]}`);
    entries.slice(0, 12).forEach((item, index) => {
      const meta = [item.context ? `@${item.context}` : null, item.priority, item.dueDate ? `due ${item.dueDate}` : null].filter(Boolean).join(" · ");
      lines.push(`${index + 1}. ${item.text}${meta ? ` (${meta})` : ""}`);
      if (item.note) lines.push(`   ${item.note}`);
    });
    lines.push("");
  });

  lines.push("Please identify the top priorities, stale waiting items, missing next actions, and the best weekly focus.");
  return lines.join("\n").trim();
}

export function priorityClassName(priority: GtdPriority) {
  return cn(
    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
    priority === "high" && "border-rose-200 bg-rose-50 text-rose-700",
    priority === "medium" && "border-amber-200 bg-amber-50 text-amber-700",
    priority === "low" && "border-emerald-200 bg-emerald-50 text-emerald-700",
  );
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function formatRelativeAge(value: string, referenceTime: number) {
  const diffDays = Math.max(0, Math.floor((referenceTime - new Date(value).getTime()) / 86400000));
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated 1 day ago";
  return `Updated ${diffDays} days ago`;
}

export function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
