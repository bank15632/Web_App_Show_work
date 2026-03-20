"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardCheck,
  Copy,
  Inbox,
  ListChecks,
  Settings2,
  Trash2,
} from "lucide-react";

import {
  bucketLabels,
  bucketOrder,
  contextOptions,
  createDefaultReviewState,
  getBucketCounts,
  getWeeklyReviewStatus,
  gtdStorageKey as storageKey,
  reviewSteps,
  reviewStorageKey,
  safeParseItems,
  safeParseReview,
  type GtdBucket,
  type GtdContext,
  type GtdItem,
  type GtdPriority,
  type WeeklyReviewState,
} from "@/lib/gtd-system";
import { cn } from "@/lib/utils";
const seededItems: GtdItem[] = [
  createSeededItem("gtd_seed_1", "สรุป feedback ลูกค้า Nordic Home Office หลัง review ล่าสุด", "inbox", "computer", "high", null, "", "2026-03-20T08:00:00.000Z"),
  createSeededItem("gtd_seed_2", "โทรตาม consultant เรื่อง revised MEP markups", "next", "phone", "high", null, "ถาม timeline ที่ confirm ได้จริงก่อนนัด client รอบถัดไป", "2026-03-19T09:30:00.000Z"),
  createSeededItem("gtd_seed_3", "รอผู้รับเหมาส่งราคา built-in ห้องนั่งเล่น", "waiting", "", "medium", "2026-03-24", "ถ้าเกินอังคารให้ follow up ทันที", "2026-03-18T04:15:00.000Z"),
  createSeededItem("gtd_seed_4", "เตรียม weekly review สำหรับทีม design", "calendar", "office", "medium", "2026-03-21", "รวบรวม blockers และงานที่ยังไม่มี next action", "2026-03-20T02:00:00.000Z"),
  createSeededItem("gtd_seed_5", "แตก template A3 report สำหรับ phase lean analytics", "someday", "computer", "low", null, "รอ phase 3 ก่อนค่อยหยิบขึ้นมา", "2026-03-17T07:45:00.000Z"),
];
const initialReferenceTime = Date.parse("2026-03-20T12:00:00.000Z");

export function GtdWorkspace() {
  const [items, setItems] = useState<GtdItem[]>(seededItems);
  const [activeBucket, setActiveBucket] = useState<GtdBucket>("inbox");
  const [activeContext, setActiveContext] = useState<GtdContext | "all">("all");
  const [draftText, setDraftText] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [review, setReview] = useState<WeeklyReviewState>(createDefaultReviewState);
  const [statusMessage, setStatusMessage] = useState("");
  const [referenceTime, setReferenceTime] = useState(initialReferenceTime);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedItems = window.localStorage.getItem(storageKey);
      const storedReview = window.localStorage.getItem(reviewStorageKey);
      setItems(safeParseItems(storedItems, seededItems));
      setReview(safeParseReview(storedReview));
      setReferenceTime(Date.now());
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    window.localStorage.setItem(reviewStorageKey, JSON.stringify(review));
  }, [review]);

  const counts = getBucketCounts(items);
  const doneThisWeek = items.filter((item) => Boolean(item.doneAt && referenceTime - new Date(item.doneAt).getTime() < 604800000)).length;
  const overdueCount = items.filter((item) => Boolean(item.dueDate && !item.done && new Date(item.dueDate).getTime() < referenceTime)).length;
  const staleWaitingCount = items.filter((item) => item.bucket === "waiting" && !item.done && referenceTime - new Date(item.updatedAt).getTime() > 432000000).length;
  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => item.bucket === activeBucket)
        .filter((item) => activeBucket !== "next" || activeContext === "all" || item.context === activeContext)
        .sort(sortItems),
    [activeBucket, activeContext, items],
  );
  const resolvedSelectedItemId =
    selectedItemId && items.some((item) => item.id === selectedItemId)
      ? selectedItemId
      : items[0]?.id ?? null;
  const selectedItem = items.find((item) => item.id === resolvedSelectedItemId) ?? null;
  const completedReviewSteps = reviewSteps.filter((step) => review.steps[step.id]).length;
  const reviewStatus = getWeeklyReviewStatus(review.lastCompletedAt, referenceTime);

  function addInboxItem() {
    const text = draftText.trim();
    if (!text) return;
    const nextItem = createSeed(text, "inbox", "", "medium");
    setItems((prev) => [nextItem, ...prev]);
    setReferenceTime(Date.now());
    setDraftText("");
    setSelectedItemId(nextItem.id);
    setActiveBucket("inbox");
    setStatusMessage("Added to inbox.");
  }

  function updateItem(itemId: string, patch: Partial<GtdItem>) {
    setReferenceTime(Date.now());
    setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
  }

  function toggleDone(item: GtdItem) {
    updateItem(item.id, { done: !item.done, doneAt: item.done ? null : new Date().toISOString() });
    setStatusMessage(item.done ? "Marked as active again." : "Marked as done.");
  }

  function processInboxItem(bucket: GtdBucket) {
    if (!selectedItem) return;
    updateItem(selectedItem.id, { bucket, done: false });
    setActiveBucket(bucket);
    setStatusMessage(`Moved to ${bucketLabels[bucket]}.`);
  }

  function deleteItem(itemId: string) {
    setReferenceTime(Date.now());
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    if (selectedItemId === itemId) setSelectedItemId(null);
    setStatusMessage("Item deleted.");
  }

  async function copyWeeklyReviewBrief() {
    const brief = buildWeeklyReviewBrief(items, review);
    try {
      await navigator.clipboard.writeText(brief);
      setStatusMessage("Copied weekly review brief.");
    } catch {
      downloadTextFile("gtd-weekly-review-brief.md", brief);
      setStatusMessage("Clipboard blocked, downloaded weekly review brief.");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ed_100%)]">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-3 px-6 py-5 lg:px-10">
          <Link href="/aec-workflow" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to AEC workflow
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
            <ListChecks className="size-4" />
            Dashboard
          </Link>
          <Link href="/todos" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
            <ArrowLeft className="size-4 rotate-180" />
            Open tracker
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
            <Settings2 className="size-4" />
            Settings & Export
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] space-y-10 px-6 py-10 lg:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
          <div className="rounded-[2rem] border border-border bg-background p-8 shadow-[0_24px_80px_rgba(0,0,0,0.04)]">
            <p className="caption-editorial">Phase 1 Module</p>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-pretty">GTD Workspace</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">Quick capture, buckets, clarify flow และ weekly review สำหรับคุมงานหลายโปรเจกต์ในที่เดียว</p>
            <div className="mt-8 flex flex-col gap-3 rounded-[1.6rem] border border-border bg-secondary/40 p-5 sm:flex-row">
              <input value={draftText} onChange={(event) => setDraftText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addInboxItem(); }} placeholder="Quick capture: พิมพ์งานที่นึกออกแล้วกด Enter" className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none transition-colors focus:border-foreground" />
              <button type="button" onClick={addInboxItem} className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90">Add to inbox</button>
            </div>
            {statusMessage ? <div className="mt-4 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm text-muted-foreground">{statusMessage}</div> : null}
            <div
              className={cn(
                "mt-4 rounded-[1.4rem] border px-5 py-4 text-sm leading-7",
                reviewStatus.tone === "good" &&
                  "border-emerald-200 bg-emerald-50 text-emerald-800",
                reviewStatus.tone === "warning" &&
                  "border-amber-200 bg-amber-50 text-amber-800",
                reviewStatus.tone === "danger" &&
                  "border-rose-200 bg-rose-50 text-rose-800",
              )}
            >
              <p className="font-medium">{reviewStatus.title}</p>
              <p className="mt-1">{reviewStatus.body}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] opacity-80">
                {reviewStatus.action}
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <MetricCard icon={<Inbox className="size-4" />} label="Inbox" value={counts.inbox} body="สิ่งที่ยังไม่ได้ clarify" />
            <MetricCard icon={<ClipboardCheck className="size-4" />} label="Done This Week" value={doneThisWeek} body="งานที่ปิดได้ใน 7 วันที่ผ่านมา" />
            <MetricCard icon={<CalendarDays className="size-4" />} label="Overdue" value={overdueCount} body="งานที่เลยกำหนดและยังไม่ done" />
            <MetricCard icon={<ListChecks className="size-4" />} label="Stale Waiting" value={staleWaitingCount} body="waiting for ที่ควร follow up" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {bucketOrder.map((bucket) => (
              <button
                key={bucket}
                type="button"
                onClick={() => setActiveBucket(bucket)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  activeBucket === bucket
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                <span>{bucketLabels[bucket]}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs", activeBucket === bucket ? "bg-background/15 text-background" : "bg-secondary text-foreground")}>
                  {counts[bucket]}
                </span>
              </button>
            ))}
          </div>

          {activeBucket === "next" ? (
            <div className="flex flex-wrap gap-2">
              {contextOptions.map((context) => (
                <button
                  key={context.value}
                  type="button"
                  onClick={() => setActiveContext(context.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    activeContext === context.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
                  )}
                >
                  {context.label}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-border bg-background px-6 py-14 text-center text-muted-foreground">
                No items in {bucketLabels[activeBucket].toLowerCase()}.
              </div>
            ) : null}

            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={cn(
                  "w-full rounded-[1.6rem] border bg-background p-5 text-left transition-all",
                  item.id === selectedItemId ? "border-foreground shadow-[0_18px_40px_rgba(0,0,0,0.06)]" : "border-border hover:border-foreground/40",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="caption-editorial text-[0.68rem]">{bucketLabels[item.bucket]}</span>
                      {item.context ? <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">@{item.context}</span> : null}
                      <span className={priorityClassName(item.priority)}>{item.priority}</span>
                    </div>
                    <h2 className={cn("mt-3 text-lg font-semibold text-pretty", item.done && "text-muted-foreground line-through")}>{item.text}</h2>
                    {item.note ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{item.note}</p> : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {item.dueDate ? <p>Due {formatShortDate(item.dueDate)}</p> : <p>No due date</p>}
                    <p className="mt-1">{formatRelativeAge(item.updatedAt, referenceTime)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-border bg-background p-5">
              <p className="caption-editorial">Item Detail</p>
              {selectedItem ? (
                <div className="mt-4 space-y-4">
                  <input value={selectedItem.text} onChange={(event) => updateItem(selectedItem.id, { text: event.target.value })} className="h-12 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={selectedItem.bucket} onChange={(event) => updateItem(selectedItem.id, { bucket: event.target.value as GtdBucket })} className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground">
                      {bucketOrder.map((bucket) => <option key={bucket} value={bucket}>{bucketLabels[bucket]}</option>)}
                    </select>
                    <select value={selectedItem.context} onChange={(event) => updateItem(selectedItem.id, { context: event.target.value as GtdContext })} className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground">
                      <option value="">No context</option>
                      {contextOptions.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select value={selectedItem.priority} onChange={(event) => updateItem(selectedItem.id, { priority: event.target.value as GtdPriority })} className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input type="date" value={selectedItem.dueDate ?? ""} onChange={(event) => updateItem(selectedItem.id, { dueDate: event.target.value || null })} className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground" />
                  </div>
                  <textarea value={selectedItem.note} onChange={(event) => updateItem(selectedItem.id, { note: event.target.value })} rows={5} placeholder="Notes, delegated owner, next step, or meeting context..." className="w-full rounded-[1.4rem] border border-border px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-foreground" />

                  {selectedItem.bucket === "inbox" ? (
                    <div className="rounded-[1.4rem] bg-secondary/50 p-4">
                      <p className="caption-editorial text-[0.68rem]">Clarify Flow</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <QuickProcessButton label="Next Action" onClick={() => processInboxItem("next")} />
                        <QuickProcessButton label="Waiting For" onClick={() => processInboxItem("waiting")} />
                        <QuickProcessButton label="Calendar" onClick={() => processInboxItem("calendar")} />
                        <QuickProcessButton label="Someday" onClick={() => processInboxItem("someday")} />
                        <QuickProcessButton label="Reference" onClick={() => processInboxItem("reference")} />
                        <QuickProcessButton label="Done in 2 min" onClick={() => toggleDone(selectedItem)} />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => toggleDone(selectedItem)} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
                      <Check className="size-4" />
                      {selectedItem.done ? "Mark active" : "Mark done"}
                    </button>
                    <button type="button" onClick={() => deleteItem(selectedItem.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50">
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-muted-foreground">Select an item to edit its bucket, context, notes, and due date.</p>
              )}
            </section>

            <section className="rounded-[2rem] border border-border bg-background p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="caption-editorial">Weekly Review</p>
                  <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">{completedReviewSteps}/{reviewSteps.length}</h2>
                </div>
                <button type="button" onClick={() => { setReview(createDefaultReviewState()); setStatusMessage("Weekly review reset."); }} className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                  Reset
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {reviewSteps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setReview((prev) => ({ ...prev, steps: { ...prev.steps, [step.id]: !prev.steps[step.id] } }))}
                    className={cn(
                      "w-full rounded-[1.25rem] border p-4 text-left transition-colors",
                      review.steps[step.id] ? "border-emerald-200 bg-emerald-50" : "border-border bg-secondary/30 hover:border-foreground/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 inline-flex size-6 items-center justify-center rounded-full border text-xs", review.steps[step.id] ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-border text-muted-foreground")}>
                        {review.steps[step.id] ? <Check className="size-3.5" /> : null}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <input value={review.focus} onChange={(event) => setReview((prev) => ({ ...prev, focus: event.target.value }))} placeholder="Weekly focus: เป้าหมายหลักของสัปดาห์นี้" className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground" />
                <textarea value={review.notes} onChange={(event) => setReview((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Review notes, bottlenecks, or commitments..." rows={4} className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-foreground" />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => { setReview((prev) => ({ ...prev, lastCompletedAt: new Date().toISOString() })); setStatusMessage("Weekly review marked complete."); }} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
                  <ClipboardCheck className="size-4" />
                  Complete review
                </button>
                <button type="button" onClick={() => { void copyWeeklyReviewBrief(); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                  <Copy className="size-4" />
                  Copy brief
                </button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {review.lastCompletedAt ? `Last completed ${formatShortDate(review.lastCompletedAt)}` : "No weekly review completed yet"}
              </p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, body }: { icon: ReactNode; label: string; value: number; body: string }) {
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

function QuickProcessButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
      {label}
    </button>
  );
}

function sortItems(a: GtdItem, b: GtdItem) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const order: Record<GtdPriority, number> = { high: 0, medium: 1, low: 2 };
  if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
  if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function buildWeeklyReviewBrief(items: GtdItem[], review: WeeklyReviewState) {
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

function priorityClassName(priority: GtdPriority) {
  return cn(
    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
    priority === "high" && "border-rose-200 bg-rose-50 text-rose-700",
    priority === "medium" && "border-amber-200 bg-amber-50 text-amber-700",
    priority === "low" && "border-emerald-200 bg-emerald-50 text-emerald-700",
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatRelativeAge(value: string, referenceTime: number) {
  const diffDays = Math.max(0, Math.floor((referenceTime - new Date(value).getTime()) / 86400000));
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated 1 day ago";
  return `Updated ${diffDays} days ago`;
}

function createId() {
  return `gtd_${crypto.randomUUID()}`;
}

function createSeed(text: string, bucket: GtdBucket, context: GtdContext, priority: GtdPriority, dueDate: string | null = null, note = ""): GtdItem {
  const now = new Date().toISOString();
  return { id: createId(), text, bucket, context, priority, dueDate, note, done: false, doneAt: null, createdAt: now, updatedAt: now };
}

function createSeededItem(
  id: string,
  text: string,
  bucket: GtdBucket,
  context: GtdContext,
  priority: GtdPriority,
  dueDate: string | null,
  note: string,
  timestamp: string,
): GtdItem {
  return { id, text, bucket, context, priority, dueDate, note, done: false, doneAt: null, createdAt: timestamp, updatedAt: timestamp };
}

function downloadTextFile(filename: string, contents: string) {
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
