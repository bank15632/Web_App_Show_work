"use client";

import { CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";

export function HoverHelp({
  label,
  body,
  buttonLabel,
  className,
  panelClassName,
}: {
  label: string;
  body: string;
  buttonLabel?: string;
  className?: string;
  panelClassName?: string;
}) {
  return (
    <div className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        aria-label={buttonLabel ?? label}
        className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        <CircleHelp className="size-4" />
      </button>
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-72 rounded-[1rem] border border-border bg-background px-4 py-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.12)] group-hover:block group-focus-within:block",
          panelClassName,
        )}
      >
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {label}
        </p>
        <p className="mt-2 whitespace-pre-line text-[12px] leading-6 text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
