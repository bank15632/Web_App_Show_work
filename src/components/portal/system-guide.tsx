"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import type { ManualSystemGuide } from "@/lib/aec-user-manual";
import { cn } from "@/lib/utils";

export function SystemGuidePanel({
  guide,
  className,
}: {
  guide: ManualSystemGuide;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="caption-editorial">How To Use {guide.name}</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">
            คู่มือใช้งาน {guide.name}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {guide.overview}
          </p>
        </div>
        <ManualStatusBadge status={guide.status} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-[1.5rem] border border-border bg-secondary/30 p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpenText className="size-4" />
            <span className="caption-editorial text-[0.68rem]">Quick Start</span>
          </div>
          <div className="mt-4 space-y-3">
            {guide.quickStart.map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-border bg-background p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="caption-editorial text-[0.68rem]">When To Use</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {guide.whenToUse}
              </p>
            </div>
            <div>
              <p className="caption-editorial text-[0.68rem]">Cadence</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {guide.cadence}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-7 text-sky-900">
            <p className="font-medium">Current Status</p>
            <p className="mt-1">{guide.statusNote}</p>
          </div>
        </article>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {guide.routine.map((step) => (
          <article
            key={step.title}
            className="rounded-[1.5rem] border border-border bg-background p-5"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" />
              <span className="caption-editorial text-[0.68rem]">Operating Rhythm</span>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{step.title}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-[1.5rem] border border-border bg-background p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-4" />
            <span className="caption-editorial text-[0.68rem]">Outputs</span>
          </div>
          <div className="mt-4 space-y-2">
            {guide.outputs.map((item) => (
              <p key={item} className="text-sm leading-7 text-muted-foreground">
                • {item}
              </p>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4" />
            <span className="caption-editorial text-[0.68rem]">Guardrail</span>
          </div>
          <p className="mt-4 text-sm leading-7">{guide.guardrail}</p>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {guide.actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            {action.label}
            <ArrowRight className="size-4" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SystemGuidePage({ guide }: { guide: ManualSystemGuide }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ed_100%)]">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="flex flex-wrap items-center gap-3 px-6 py-5 lg:px-10">
          <Link
            href="/aec-workflow"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            User Manual
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4 rotate-180" />
            Dashboard
          </Link>
          {guide.actions.slice(0, 2).map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ArrowRight className="size-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="space-y-10 px-6 py-12 lg:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
          <div className="rounded-[2rem] border border-border bg-background p-8 shadow-[0_24px_80px_rgba(0,0,0,0.04)]">
            <p className="caption-editorial">System Guide</p>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">
              {guide.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              {guide.role}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {guide.overview}
            </p>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[1.5rem] border border-border bg-background p-5">
              <p className="caption-editorial text-[0.68rem]">Status</p>
              <div className="mt-3">
                <ManualStatusBadge status={guide.status} />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {guide.statusNote}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-border bg-background p-5">
              <p className="caption-editorial text-[0.68rem]">When To Use</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {guide.whenToUse}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-border bg-background p-5">
              <p className="caption-editorial text-[0.68rem]">Cadence</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {guide.cadence}
              </p>
            </article>
          </div>
        </section>

        <SystemGuidePanel guide={guide} />
      </main>
    </div>
  );
}

function ManualStatusBadge({
  status,
}: {
  status: "available" | "partial" | "planned";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        status === "available" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "partial" &&
          "border-amber-200 bg-amber-50 text-amber-700",
        status === "planned" &&
          "border-border bg-background text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
