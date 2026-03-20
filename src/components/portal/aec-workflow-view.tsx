import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  Layers3,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  aecAudience,
  aecMetrics,
  aecMvpWeeks,
  aecNextSteps,
  aecPillars,
  aecPlatformSummary,
  aecRisks,
  aecRoadmap,
  aecTechStack,
} from "@/lib/aec-workflow-content";

export function AecWorkflowView() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ed_100%)]">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3 px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <Link
            href="/todos"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            Open tracker
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-16 px-6 py-12 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_24rem]">
          <div className="rounded-[2rem] border border-border bg-background p-8 shadow-[0_24px_80px_rgba(0,0,0,0.04)]">
            <p className="caption-editorial">Imported Strategy</p>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-pretty">
              {aecPlatformSummary.title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              {aecPlatformSummary.subtitle}
            </p>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted-foreground">
              {aecPlatformSummary.promise}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              {aecPlatformSummary.target}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <StatPill label="Prepared" value={aecPlatformSummary.preparedAt} />
              <StatPill label="Version" value={aecPlatformSummary.version} />
              <StatPill label="Delivery Window" value="20-24 weeks" />
              <StatPill label="Primary Goal" value="Operational clarity + speed" />
            </div>
          </div>

          <div className="grid gap-4">
            <MiniCard
              icon={<Layers3 className="size-4" />}
              label="Framework Blend"
              title="5 systems in one workflow"
              body="GTD, Kanban, Lean, CPM และ Agile ถูกวางเป็น stack เดียว ไม่แยกเครื่องมือกระจัดกระจาย."
            />
            <MiniCard
              icon={<Gauge className="size-4" />}
              label="MVP Focus"
              title="Use daily before scaling"
              body="เอกสารเน้นชัดว่า phase แรกต้องใช้เองได้จริงก่อนชวนทีมเข้ามา."
            />
            <MiniCard
              icon={<Sparkles className="size-4" />}
              label="AI Layer"
              title="Insights after the workflow is stable"
              body="AI ถูกวางไว้ช่วย summarize, detect bottlenecks และ suggest next action หลังมี data พอ."
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="caption-editorial">Core Pillars</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              Workflow architecture
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {aecPillars.map((pillar) => (
              <article
                key={pillar.name}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <p className="caption-editorial text-[0.68rem]">{pillar.name}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {pillar.summary}
                </p>
                <p className="mt-4 border-t border-border pt-4 text-sm font-medium text-foreground">
                  {pillar.outcome}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-border bg-background p-6">
            <p className="caption-editorial">Target Users</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              Who this platform is for
            </h2>
            <div className="mt-6 space-y-4">
              {aecAudience.map((item) => (
                <article
                  key={item.role}
                  className="rounded-[1.4rem] border border-border/80 bg-secondary/40 p-4"
                >
                  <h3 className="text-base font-medium">{item.role}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Pain point: {item.painPoint}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-foreground">
                    Solution: {item.solution}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-background p-6">
            <p className="caption-editorial">Technology</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              Proposed stack
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {aecTechStack.map((item) => (
                <article
                  key={item.layer}
                  className="rounded-[1.25rem] border border-border/80 bg-secondary/40 p-4"
                >
                  <p className="caption-editorial text-[0.68rem]">{item.layer}</p>
                  <h3 className="mt-2 text-sm font-semibold">{item.technology}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.rationale}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="caption-editorial">Roadmap</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              Progressive delivery across five phases
            </h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-5">
            {aecRoadmap.map((phase) => (
              <article
                key={phase.name}
                className="rounded-[1.75rem] border border-border bg-background p-5"
              >
                <p className="caption-editorial text-[0.68rem]">{phase.duration}</p>
                <h3 className="mt-2 text-lg font-semibold text-pretty">{phase.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{phase.framework}</p>
                <p className="mt-4 text-sm font-medium">{phase.deliverable}</p>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {phase.highlights.map((highlight) => (
                    <p key={highlight} className="text-sm leading-6 text-muted-foreground">
                      {highlight}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[2rem] border border-border bg-background p-6">
            <p className="caption-editorial">Execution Guide</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              MVP build cadence
            </h2>
            <div className="mt-6 space-y-4">
              {aecMvpWeeks.map((week) => (
                <article
                  key={week.week}
                  className="rounded-[1.4rem] border border-border/80 bg-secondary/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-medium">{week.week}</h3>
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {week.focus}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {week.outcome}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-background p-6">
              <p className="caption-editorial">Success Metrics</p>
              <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
                What good looks like
              </h2>
              <div className="mt-6 space-y-3">
                {aecMetrics.map((metric) => (
                  <article
                    key={metric.name}
                    className="rounded-[1.25rem] border border-border/80 bg-secondary/40 p-4"
                  >
                    <h3 className="text-sm font-semibold">{metric.name}</h3>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <span>Baseline: {metric.baseline}</span>
                      <span>3 mo: {metric.threeMonth}</span>
                      <span>6 mo: {metric.sixMonth}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-background p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-muted-foreground" />
                <p className="caption-editorial">Risks & Next Steps</p>
              </div>
              <div className="mt-5 space-y-4">
                {aecRisks.map((risk) => (
                  <article key={risk.name} className="rounded-[1.25rem] border border-border/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">{risk.name}</h3>
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        {risk.impact}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {risk.mitigation}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-secondary/50 p-5">
                <p className="caption-editorial text-[0.68rem]">Immediate Next Steps</p>
                <div className="mt-4 space-y-3">
                  {aecNextSteps.map((step, index) => (
                    <p key={step} className="text-sm leading-7 text-muted-foreground">
                      {index + 1}. {step}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full border border-border bg-secondary/50 px-4 py-2">
      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="ml-2 text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  title,
  body,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="caption-editorial text-[0.68rem]">{label}</span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-pretty">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
    </article>
  );
}
