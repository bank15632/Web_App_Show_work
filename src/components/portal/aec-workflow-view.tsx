"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CalendarClock,
  Settings2,
} from "lucide-react";

import {
  manualDailyRoutine,
  manualDashboardPanels,
  manualFaq,
  manualFrameworkCards,
  manualSettingsCards,
} from "@/lib/aec-user-manual";
import { cn } from "@/lib/utils";

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
            Dashboard
          </Link>
          <Link
            href="/gtd"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            GTD Workspace
          </Link>
          <Link
            href="/todos"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            Kanban Board
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Settings2 className="size-4" />
            Settings & Export
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-14 px-6 py-12 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_22rem]">
          <div className="rounded-[2rem] border border-border bg-background p-8 shadow-[0_24px_80px_rgba(0,0,0,0.04)]">
            <p className="caption-editorial">User Manual</p>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-pretty">
              AEC Workflow Platform
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              คู่มือการใช้งานฉบับสมบูรณ์สำหรับสถาปนิกและทีม AEC
              ที่ต้องคุมงานส่วนตัว, project board, weekly review และ export
              ใน workflow เดียว
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["GTD", "Kanban", "Lean", "CPM", "AI Assistant"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <MiniInfoCard
              title="Start simple"
              body="เริ่มจาก GTD อย่างเดียว 2 สัปดาห์ แล้วค่อยเพิ่ม Kanban เมื่อ flow เริ่มนิ่ง"
            />
            <MiniInfoCard
              title="Protect deep work"
              body="คู่มือแนะนำให้ใช้ platform รวมทั้งวันไม่เกิน 30-40 นาที ที่เหลือคือเวลาทำงานจริง"
            />
            <MiniInfoCard
              title="Review weekly"
              body="เตือนทุก 7 วัน, เกิน 10 วันขึ้นแดง, ถ้าหลุด 3 สัปดาห์ให้ทำ Brain Dump ใหม่"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="caption-editorial">Dashboard</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              หน้าจอหลักควรเห็นอะไรบ้าง
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              ตามคู่มือ dashboard ต้องสรุปภาพรวมทั้งระบบในหน้าเดียว:
              GTD stats, Kanban overview, upcoming และ AI insights
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {manualDashboardPanels.map((panel) => (
              <article
                key={panel.title}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <p className="caption-editorial text-[0.68rem]">{panel.title}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {panel.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="caption-editorial">Frameworks</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              5 systems ใน workflow เดียว
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {manualFrameworkCards.map((framework) => (
              <article
                key={framework.name}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="caption-editorial text-[0.68rem]">{framework.name}</p>
                  <StatusBadge status={framework.status} />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{framework.role}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {framework.whenToUse}
                </p>
                <div className="mt-4">
                  {framework.href ? (
                    <Link
                      href={framework.guideHref ?? framework.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      {framework.guideActionLabel ?? framework.actionLabel}
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground">
                      Planned module
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="caption-editorial">Daily Routine</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              ตารางใช้งานที่คู่มือแนะนำ
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {manualDailyRoutine.map((step) => (
              <article
                key={step.time}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="size-4" />
                  <span className="caption-editorial text-[0.68rem]">{step.time}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{step.action}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.module}
                </p>
                <p className="mt-3 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {step.duration}
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-7 text-sky-900">
            <p className="font-medium">TIP</p>
            <p className="mt-1">
              รวมเวลาที่ใช้กับ platform ทั้งวันไม่เกิน 30-40 นาที
              ระบบมีไว้ช่วยให้เลือกงานที่ถูกต้อง ไม่ใช่ให้มาจมอยู่กับระบบ
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="caption-editorial">Settings + Team</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              สิ่งที่ผู้ใช้ควรตั้งค่า
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {manualSettingsCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="caption-editorial text-[0.68rem]">{card.title}</p>
                  <StatusBadge status={card.status} />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <BookOpenText className="size-4 text-muted-foreground" />
              <p className="caption-editorial">FAQ</p>
            </div>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              คำถามที่คู่มือย้ำบ่อยที่สุด
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {manualFaq.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "available" | "partial" | "planned";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
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

function MiniInfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-background p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
    </article>
  );
}
