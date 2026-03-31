"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Check,
  ClipboardCheck,
  Copy,
  Inbox,
  ListChecks,
  LoaderCircle,
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
  reviewSteps,
  type GtdBucket,
  type GtdContext,
  type GtdItem,
  type GtdPriority,
  type GtdWorkspaceData,
  type WeeklyReviewState,
} from "@/lib/gtd-system";
import {
  createGtdItemRequest,
  deleteGtdItemRequest,
  fetchGtdWorkspace,
  updateGtdItemRequest,
  updateGtdReviewRequest,
} from "@/lib/gtd/client";
import {
  phaseLabels,
  taskTypeDescriptions,
  taskTypeLabels,
} from "@/lib/tracker/constants";
import {
  createTrackerTaskRequest,
  fetchTrackerWorkspace,
} from "@/lib/tracker/client";
import type {
  TrackerProjectDetail,
  TrackerTaskType,
} from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
const initialReferenceTime = Date.parse("2026-03-20T12:00:00.000Z");
type GtdListMode = "active" | "archived";
type KanbanBridgeDraft = {
  projectId: string;
  taskType: TrackerTaskType;
};
interface PendingAction {
  buttonKey: string;
  label: string;
  type:
    | "add-inbox"
    | "item-action"
    | "item-open-kanban"
    | "kanban-send"
    | "review-action"
    | "copy-brief";
  itemId?: string;
}

export function GtdWorkspace() {
  const [items, setItems] = useState<GtdItem[]>([]);
  const [activeBucket, setActiveBucket] = useState<GtdBucket>("inbox");
  const [activeContext, setActiveContext] = useState<GtdContext | "all">("all");
  const [activeListMode, setActiveListMode] = useState<GtdListMode>("active");
  const [draftText, setDraftText] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<GtdItem | null>(null);
  const [review, setReview] = useState<WeeklyReviewState>(createDefaultReviewState);
  const [statusMessage, setStatusMessage] = useState("");
  const [referenceTime, setReferenceTime] = useState(initialReferenceTime);
  const [isLoading, setIsLoading] = useState(true);
  const [trackerProjects, setTrackerProjects] = useState<TrackerProjectDetail[]>([]);
  const [isKanbanDialogOpen, setIsKanbanDialogOpen] = useState(false);
  const [isTrackerLoading, setIsTrackerLoading] = useState(false);
  const [isSendingToKanban, setIsSendingToKanban] = useState(false);
  const [kanbanDraft, setKanbanDraft] = useState<KanbanBridgeDraft>({
    projectId: "",
    taskType: "design",
  });
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showNoDeadlineAlert, setShowNoDeadlineAlert] = useState(false);
  const actionLockRef = useRef(false);
  const activeButtonKeyRef = useRef<string | null>(null);
  const queuedActionKeysRef = useRef(new Set<string>());

  useEffect(() => {
    let ignore = false;

    async function refreshWorkspace(silent = false) {
      try {
        const workspace = await fetchGtdWorkspace();
        if (!ignore) applyWorkspace(workspace);
      } catch (error) {
        if (!ignore && !silent) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to load GTD workspace.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      void refreshWorkspace();
    });

    const handleWindowFocus = () => {
      void refreshWorkspace(true);
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      ignore = true;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    void loadTrackerProjects({ silent: true });
  }, []);

  const noDeadlineItems = useMemo(
    () => items.filter((item) => !item.dueDate && !item.done),
    [items],
  );

  useEffect(() => {
    if (!isLoading && noDeadlineItems.length > 0) {
      setShowNoDeadlineAlert(true);
    }
  }, [isLoading]);

  const counts = getBucketCounts(items);
  const archivedCount = items.filter((item) => item.done).length;
  const doneThisWeek = items.filter((item) => Boolean(item.doneAt && referenceTime - new Date(item.doneAt).getTime() < 604800000)).length;
  const overdueCount = items.filter((item) => Boolean(item.dueDate && !item.done && new Date(item.dueDate).getTime() < referenceTime)).length;
  const staleWaitingCount = items.filter((item) => item.bucket === "waiting" && !item.done && referenceTime - new Date(item.updatedAt).getTime() > 432000000).length;
  const filteredItems = useMemo(
    () => {
      if (activeListMode === "archived") {
        return items.filter((item) => item.done).sort(sortArchivedItems);
      }

      return items
        .filter((item) => !item.done && item.bucket === activeBucket)
        .filter((item) => activeBucket !== "next" || activeContext === "all" || item.context === activeContext)
        .sort(sortItems);
    },
    [activeBucket, activeContext, activeListMode, items],
  );
  const resolvedSelectedItemId =
    selectedItemId && filteredItems.some((item) => item.id === selectedItemId)
      ? selectedItemId
      : filteredItems[0]?.id ?? null;
  const selectedItem = filteredItems.find((item) => item.id === resolvedSelectedItemId) ?? null;
  const isWorkspaceActionPending = pendingAction !== null;
  const selectedItemPendingAction =
    selectedItem && pendingAction?.itemId === selectedItem.id ? pendingAction : null;
  const isSelectedItemLocked = Boolean(selectedItemPendingAction);
  const reviewPendingAction =
    pendingAction?.type === "review-action" || pendingAction?.type === "copy-brief"
      ? pendingAction
      : null;
  const completedReviewSteps = reviewSteps.filter((step) => review.steps[step.id]).length;
  const reviewStatus = getWeeklyReviewStatus(review.lastCompletedAt, referenceTime);

  useEffect(() => {
    setItemDraft(selectedItem ? { ...selectedItem } : null);
  }, [selectedItem]);

  useEffect(() => {
    if (trackerProjects.length === 0 || kanbanDraft.projectId) return;

    setKanbanDraft((prev) => ({
      ...prev,
      projectId: trackerProjects[0]?.id ?? "",
    }));
  }, [kanbanDraft.projectId, trackerProjects]);

  function applyWorkspace(workspace: GtdWorkspaceData) {
    setItems(workspace.items);
    setReview(workspace.review);
    setReferenceTime(Date.now());
  }

  function isPendingButton(buttonKey: string) {
    return pendingAction?.buttonKey === buttonKey;
  }

  async function withPendingAction<T>(
    action: PendingAction,
    run: () => Promise<T>,
  ) {
    if (actionLockRef.current) {
      if (
        activeButtonKeyRef.current === action.buttonKey ||
        queuedActionKeysRef.current.has(action.buttonKey)
      ) {
        return null;
      }

      queuedActionKeysRef.current.add(action.buttonKey);

      while (actionLockRef.current) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 50);
        });
      }
    }

    actionLockRef.current = true;
    activeButtonKeyRef.current = action.buttonKey;
    setPendingAction(action);

    try {
      return await run();
    } finally {
      actionLockRef.current = false;
      activeButtonKeyRef.current = null;
      setPendingAction(null);
      queuedActionKeysRef.current.delete(action.buttonKey);
    }
  }

  async function loadTrackerProjects({ silent = false }: { silent?: boolean } = {}) {
    setIsTrackerLoading(true);
    try {
      const workspace = await fetchTrackerWorkspace();
      setTrackerProjects(workspace.projects);
      return workspace.projects;
    } catch (error) {
      if (!silent) {
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to load Kanban projects.",
        );
      }
      return [] satisfies TrackerProjectDetail[];
    } finally {
      setIsTrackerLoading(false);
    }
  }

  async function loadWorkspace({ silent = false }: { silent?: boolean } = {}) {
    try {
      const workspace = await fetchGtdWorkspace();
      applyWorkspace(workspace);
    } catch (error) {
      if (!silent) {
        setStatusMessage(
          error instanceof Error ? error.message : "Failed to refresh GTD workspace.",
        );
      }
    }
  }

  async function addInboxItem() {
    const text = draftText.trim();
    if (!text) return;

    await withPendingAction(
      {
        type: "add-inbox",
        label: "Adding to inbox...",
        buttonKey: "add-inbox",
      },
      async () => {
        try {
          const data = await createGtdItemRequest({
            text,
            bucket: "inbox",
            context: "",
            priority: "medium",
          });
          applyWorkspace(data.workspace);
          setDraftText("");
          setSelectedItemId(data.item.id);
          setActiveListMode("active");
          setActiveBucket("inbox");
          setStatusMessage("Added to inbox.");
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to add inbox item.",
          );
        }
      },
    );
  }

  async function updateItem(
    itemId: string,
    patch: Partial<GtdItem>,
    successMessage?: string,
    pendingLabel = "Saving changes...",
    buttonKey = "item-detail",
  ) {
    const optimisticUpdatedAt = new Date().toISOString();

    await withPendingAction(
      {
        type: "item-action",
        itemId,
        label: pendingLabel,
        buttonKey,
      },
      async () => {
        setReferenceTime(Date.now());
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...patch,
                  updatedAt: optimisticUpdatedAt,
                }
              : item,
          ),
        );

        try {
          await updateGtdItemRequest(itemId, {
            text: patch.text,
            bucket: patch.bucket,
            context: patch.context,
            priority: patch.priority,
            dueDate: patch.dueDate,
            note: patch.note,
            linkedProjectId: patch.linkedProjectId,
            linkedTaskId: patch.linkedTaskId,
            done: patch.done,
            doneAt: patch.doneAt,
          });
          if (successMessage) setStatusMessage(successMessage);
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to update GTD item.",
          );
          void loadWorkspace({ silent: true });
        }
      },
    );
  }

  function updateItemDraft(patch: Partial<GtdItem>) {
    setItemDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveItemDraft() {
    if (!selectedItem || !itemDraft) return;

    const patch: Partial<GtdItem> = {};

    if (itemDraft.text !== selectedItem.text) patch.text = itemDraft.text;
    if (itemDraft.note !== selectedItem.note) patch.note = itemDraft.note;
    if (Object.keys(patch).length === 0) return;

    await updateItem(
      selectedItem.id,
      patch,
      undefined,
      "Saving item details...",
      "item-detail",
    );
  }

  function toggleDone(item: GtdItem, buttonKey = "toggle-item") {
    if (item.done) {
      setActiveListMode("active");
      setActiveBucket(item.bucket);
      setActiveContext(item.bucket === "next" && item.context ? item.context : "all");
      setSelectedItemId(item.id);
    }

    void updateItem(
      item.id,
      { done: !item.done, doneAt: item.done ? null : new Date().toISOString() },
      item.done ? "Marked as active again." : "Marked as done and moved to Archived.",
      item.done ? "Restoring item..." : "Marking item done...",
      buttonKey,
    );
  }

  function processInboxItem(bucket: GtdBucket) {
    if (!selectedItem) return;
    void updateItem(
      selectedItem.id,
      { bucket, done: false, doneAt: null },
      `Moved to ${bucketLabels[bucket]}.`,
      `Moving to ${bucketLabels[bucket]}...`,
      `process:${bucket}`,
    );
    setActiveListMode("active");
    setActiveBucket(bucket);
  }

  async function deleteItem(itemId: string) {
    await withPendingAction(
      {
        type: "item-action",
        itemId,
        label: "Deleting item...",
        buttonKey: "delete-item",
      },
      async () => {
        try {
          const response = await deleteGtdItemRequest(itemId);
          applyWorkspace(response.workspace);
          if (selectedItemId === itemId) setSelectedItemId(null);
          setStatusMessage("Item deleted.");
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to delete item.",
          );
          void loadWorkspace({ silent: true });
        }
      },
    );
  }

  async function openKanbanDialog() {
    if (!selectedItem) return;

    await withPendingAction(
      {
        type: "item-open-kanban",
        itemId: selectedItem.id,
        label: "Loading Kanban projects...",
        buttonKey: "open-kanban",
      },
      async () => {
        const projects =
          trackerProjects.length > 0
            ? trackerProjects
            : await loadTrackerProjects();

        if (projects.length > 0) {
          setKanbanDraft((prev) => ({
            ...prev,
            projectId: prev.projectId || projects[0]?.id || "",
          }));
        }

        setIsKanbanDialogOpen(true);
      },
    );
  }

  async function sendSelectedItemToKanban() {
    if (!selectedItem) return;

    const project = trackerProjects.find((entry) => entry.id === kanbanDraft.projectId);
    if (!project) {
      setStatusMessage("Select a Kanban project first.");
      return;
    }

    await withPendingAction(
      {
        type: "kanban-send",
        itemId: selectedItem.id,
        label: "Creating Kanban task...",
        buttonKey: "create-kanban",
      },
      async () => {
        setIsSendingToKanban(true);
        try {
          await createTrackerTaskRequest(project.id, {
            phase: project.phase,
            taskType: kanbanDraft.taskType,
            title: selectedItem.text,
            description: selectedItem.note,
            status: "todo",
            priority: selectedItem.priority,
            dueDate: selectedItem.dueDate,
            sourceType: "gtd.bridge",
            sourceRef: selectedItem.id,
            nextAction: selectedItem.note,
            humanVerified: true,
          });

          const deleteResponse = await deleteGtdItemRequest(selectedItem.id);
          applyWorkspace(deleteResponse.workspace);
          setSelectedItemId(null);
          setIsKanbanDialogOpen(false);
          setStatusMessage(`Sent to Kanban project "${project.name}" and removed from GTD.`);
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to send item to Kanban.",
          );
        } finally {
          setIsSendingToKanban(false);
        }
      },
    );
  }

  async function updateReviewState(
    patch: Partial<WeeklyReviewState> & { reset?: boolean; steps?: Record<string, boolean> },
    successMessage?: string,
    pendingLabel = "Saving weekly review...",
    buttonKey = "review-detail",
  ) {
    const nextReview = patch.reset
      ? createDefaultReviewState()
      : {
          ...review,
          ...patch,
          steps: {
            ...review.steps,
            ...(patch.steps ?? {}),
          },
        };

    await withPendingAction(
      {
        type: "review-action",
        label: pendingLabel,
        buttonKey,
      },
      async () => {
        setReview(nextReview);
        setReferenceTime(Date.now());

        try {
          await updateGtdReviewRequest({
            steps: patch.steps,
            focus: patch.focus,
            notes: patch.notes,
            lastCompletedAt: patch.lastCompletedAt,
            reset: patch.reset,
          });
          if (successMessage) setStatusMessage(successMessage);
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to update weekly review.",
          );
          void loadWorkspace({ silent: true });
        }
      },
    );
  }

  async function copyWeeklyReviewBrief() {
    const brief = buildWeeklyReviewBrief(items, review);
    await withPendingAction(
      {
        type: "copy-brief",
        label: "Copying weekly review brief...",
        buttonKey: "copy-brief",
      },
      async () => {
        try {
          await navigator.clipboard.writeText(brief);
          setStatusMessage("Copied weekly review brief.");
        } catch {
          downloadTextFile("gtd-weekly-review-brief.md", brief);
          setStatusMessage("Clipboard blocked, downloaded weekly review brief.");
        }
      },
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ed_100%)]">
      {showNoDeadlineAlert && noDeadlineItems.length > 0 ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          onClick={() => setShowNoDeadlineAlert(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-violet-600">
                  No Deadline Warning
                </p>
                <h3 className="mt-1 font-display text-2xl font-medium tracking-tight">
                  {noDeadlineItems.length} item{noDeadlineItems.length === 1 ? "" : "s"} without deadline
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Item เหล่านี้ยังไม่มีกำหนดส่ง ควรตั้ง deadline เพื่อติดตามได้ชัดเจน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNoDeadlineAlert(false)}
                className="shrink-0 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {noDeadlineItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setShowNoDeadlineAlert(false);
                    setActiveListMode("active");
                    setActiveBucket(item.bucket);
                    setSelectedItemId(item.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-violet-200 bg-violet-50/50 px-4 py-3 text-left transition-colors hover:border-violet-400"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {bucketLabels[item.bucket]} · {item.priority}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-600">
                    Set deadline
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-4 sm:flex-wrap sm:gap-3 sm:px-6 sm:py-5 lg:px-10">
          <Link href="/aec-workflow" aria-label="Back to AEC workflow" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-4">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to AEC workflow</span>
          </Link>
          <Link href="/" aria-label="Dashboard" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-4">
            <ListChecks className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/todos" aria-label="Open Kanban board" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-4">
            <ArrowLeft className="size-4 rotate-180" />
            <span className="hidden sm:inline">Open Kanban board</span>
          </Link>
          <Link href="/settings" aria-label="Settings & Export" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-4">
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Settings & Export</span>
          </Link>
          <Link href="/gtd/guide" aria-label="GTD Guide" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:px-4">
            <BookOpenText className="size-4" />
            <span className="hidden sm:inline">GTD Guide</span>
          </Link>
        </div>
      </header>

      <main className="space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10 lg:px-10">
        <section className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
          <div className="rounded-[1.5rem] border border-border bg-background p-5 shadow-[0_24px_80px_rgba(0,0,0,0.04)] sm:rounded-[2rem] sm:p-8">
            <p className="caption-editorial">Phase 1 Module</p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-pretty sm:text-4xl lg:text-5xl">GTD Workspace</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-8">Quick capture, buckets, clarify flow และ weekly review สำหรับคุมงานหลายโปรเจกต์ในที่เดียว</p>
            <div className="mt-8 flex flex-col gap-3 rounded-[1.6rem] border border-border bg-secondary/40 p-5 sm:flex-row">
              <input
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (!isWorkspaceActionPending) void addInboxItem();
                }}
                disabled={isPendingButton("add-inbox")}
                placeholder="Quick capture: พิมพ์งานที่นึกออกแล้วกด Enter"
                className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => {
                  void addInboxItem();
                }}
                disabled={!draftText.trim() || isWorkspaceActionPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPendingButton("add-inbox") ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add to inbox"
                )}
              </button>
            </div>
            {isLoading ? (
              <div className="mt-4 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                Loading GTD workspace...
              </div>
            ) : null}
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-1">
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
                onClick={() => {
                  setActiveListMode("active");
                  setActiveBucket(bucket);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  activeListMode === "active" && activeBucket === bucket
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                <span>{bucketLabels[bucket]}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    activeListMode === "active" && activeBucket === bucket
                      ? "bg-background/15 text-background"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {counts[bucket]}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActiveListMode("archived")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                activeListMode === "archived"
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              <span>Archived</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  activeListMode === "archived"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-secondary text-foreground",
                )}
              >
                {archivedCount}
              </span>
            </button>
          </div>

          {activeListMode === "active" && activeBucket === "next" ? (
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
                {activeListMode === "archived"
                  ? "No archived items yet."
                  : `No items in ${bucketLabels[activeBucket].toLowerCase()}.`}
              </div>
            ) : null}

            {filteredItems.map((item) => {
              const hasNoDeadline = !item.dueDate && !item.done;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  disabled={Boolean(pendingAction?.itemId)}
                  className={cn(
                    "w-full rounded-[1.6rem] border p-5 text-left transition-all",
                    item.id === resolvedSelectedItemId
                      ? "border-foreground shadow-[0_18px_40px_rgba(0,0,0,0.06)]"
                      : hasNoDeadline
                        ? "border-violet-200 bg-violet-50/40 hover:border-violet-400"
                        : "border-border bg-background hover:border-foreground/40",
                    !hasNoDeadline && item.id !== resolvedSelectedItemId && "bg-background",
                    pendingAction?.itemId && "cursor-not-allowed opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="caption-editorial text-[0.68rem]">{bucketLabels[item.bucket]}</span>
                        {item.context ? <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">@{item.context}</span> : null}
                        <span className={priorityClassName(item.priority)}>{item.priority}</span>
                        {hasNoDeadline ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-600">
                            No deadline
                          </span>
                        ) : null}
                      </div>
                      <h2 className={cn("mt-3 text-lg font-semibold text-pretty", item.done && "text-muted-foreground line-through")}>{item.text}</h2>
                      {item.note ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{item.note}</p> : null}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {item.dueDate ? <p>Due {formatShortDate(item.dueDate)}</p> : <p className="text-violet-500 font-medium">No due date</p>}
                      <p className="mt-1">{formatRelativeAge(item.updatedAt, referenceTime)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="caption-editorial">Item Detail</p>
                {selectedItemPendingAction ? <LoadingPill label={selectedItemPendingAction.label} /> : null}
              </div>
              {selectedItem ? (
                <div className="mt-4 space-y-4">
                  <input
                    value={itemDraft?.text ?? ""}
                    onChange={(event) => updateItemDraft({ text: event.target.value })}
                    onBlur={() => {
                      void saveItemDraft();
                    }}
                    disabled={isSelectedItemLocked}
                    className="h-12 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={itemDraft?.bucket ?? selectedItem.bucket}
                      onChange={(event) => {
                        const bucket = event.target.value as GtdBucket;
                        updateItemDraft({ bucket });
                        setActiveBucket(bucket);
                        void updateItem(
                          selectedItem.id,
                          { bucket },
                          undefined,
                          `Moving to ${bucketLabels[bucket]}...`,
                          "item-detail",
                        );
                      }}
                      disabled={isSelectedItemLocked}
                      className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bucketOrder.map((bucket) => <option key={bucket} value={bucket}>{bucketLabels[bucket]}</option>)}
                    </select>
                    <select
                      value={itemDraft?.context ?? selectedItem.context}
                      onChange={(event) => {
                        const context = event.target.value as GtdContext;
                        updateItemDraft({ context });
                        void updateItem(
                          selectedItem.id,
                          { context },
                          undefined,
                          "Updating context...",
                          "item-detail",
                        );
                      }}
                      disabled={isSelectedItemLocked}
                      className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">No context</option>
                      {contextOptions.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select
                      value={itemDraft?.priority ?? selectedItem.priority}
                      onChange={(event) => {
                        const priority = event.target.value as GtdPriority;
                        updateItemDraft({ priority });
                        void updateItem(
                          selectedItem.id,
                          { priority },
                          undefined,
                          "Updating priority...",
                          "item-detail",
                        );
                      }}
                      disabled={isSelectedItemLocked}
                      className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input
                      type="date"
                      value={itemDraft?.dueDate ?? selectedItem.dueDate ?? ""}
                      onChange={(event) => {
                        const dueDate = event.target.value || null;
                        updateItemDraft({ dueDate });
                        void updateItem(
                          selectedItem.id,
                          { dueDate },
                          undefined,
                          "Updating due date...",
                          "item-detail",
                        );
                      }}
                      disabled={isSelectedItemLocked}
                      className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <textarea
                    value={itemDraft?.note ?? ""}
                    onChange={(event) => updateItemDraft({ note: event.target.value })}
                    onBlur={() => {
                      void saveItemDraft();
                    }}
                    rows={5}
                    placeholder="Notes, delegated owner, next step, or meeting context..."
                    disabled={isSelectedItemLocked}
                    className="w-full rounded-[1.4rem] border border-border px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {selectedItem.done ? (
                    <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      Archived on {formatShortDate(selectedItem.doneAt ?? selectedItem.updatedAt)}.
                      Use Mark active to restore it to {bucketLabels[selectedItem.bucket]}.
                    </div>
                  ) : null}

                  {selectedItem.linkedProjectId && selectedItem.linkedTaskId ? (
                    <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <p className="font-medium">Linked to Kanban.</p>
                      <p className="mt-1">
                        This GTD item is connected to a Kanban task. Open it in Kanban to
                        update board status or execution details.
                      </p>
                    </div>
                  ) : null}

                  {selectedItem.bucket === "inbox" && !selectedItem.done ? (
                    <div className="rounded-[1.4rem] bg-secondary/50 p-4">
                      <p className="caption-editorial text-[0.68rem]">Clarify Flow</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <QuickProcessButton label="Next Action" onClick={() => processInboxItem("next")} disabled={isSelectedItemLocked} isPending={isPendingButton("process:next")} />
                        <QuickProcessButton label="Waiting For" onClick={() => processInboxItem("waiting")} disabled={isSelectedItemLocked} isPending={isPendingButton("process:waiting")} />
                        <QuickProcessButton label="Calendar" onClick={() => processInboxItem("calendar")} disabled={isSelectedItemLocked} isPending={isPendingButton("process:calendar")} />
                        <QuickProcessButton label="Someday" onClick={() => processInboxItem("someday")} disabled={isSelectedItemLocked} isPending={isPendingButton("process:someday")} />
                        <QuickProcessButton label="Reference" onClick={() => processInboxItem("reference")} disabled={isSelectedItemLocked} isPending={isPendingButton("process:reference")} />
                        <QuickProcessButton label="Done in 2 min" onClick={() => toggleDone(selectedItem, "toggle-quick")} disabled={isSelectedItemLocked} isPending={isPendingButton("toggle-quick")} />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {!selectedItem.done ? (
                      <button
                        type="button"
                        onClick={() => {
                          void openKanbanDialog();
                        }}
                        disabled={isWorkspaceActionPending}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPendingButton("open-kanban") ? (
                          <>
                            <LoaderCircle className="size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          selectedItem.linkedTaskId ? "Create another Kanban task" : "Send to Kanban"
                        )}
                      </button>
                    ) : null}
                    {selectedItem.linkedProjectId && selectedItem.linkedTaskId ? (
                      <Link
                        href={`/todos?project=${selectedItem.linkedProjectId}&task=${selectedItem.linkedTaskId}`}
                        className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                      >
                        <ArrowUpRight className="size-4" />
                        Open in Kanban
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleDone(selectedItem)}
                      disabled={isWorkspaceActionPending}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        selectedItem.done
                          ? "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-500",
                      )}
                    >
                      {isPendingButton("toggle-item") ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      {isPendingButton("toggle-item")
                        ? selectedItem.done
                          ? "Restoring..."
                          : "Saving..."
                        : selectedItem.done
                          ? "Mark active"
                          : "Mark done"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteItem(selectedItem.id);
                      }}
                      disabled={isWorkspaceActionPending}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPendingButton("delete-item") ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      {isPendingButton("delete-item") ? "Deleting..." : "Delete"}
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
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {reviewPendingAction ? <LoadingPill label={reviewPendingAction.label} /> : null}
                  <button
                    type="button"
                    onClick={() => {
                      void updateReviewState(
                        { reset: true },
                        "Weekly review reset.",
                        "Resetting weekly review...",
                        "review-reset",
                      );
                    }}
                    disabled={isWorkspaceActionPending}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPendingButton("review-reset") ? <LoaderCircle className="size-4 animate-spin" /> : null}
                    {isPendingButton("review-reset") ? "Resetting..." : "Reset"}
                  </button>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {reviewSteps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      void updateReviewState({
                        steps: { [step.id]: !review.steps[step.id] },
                      }, undefined, `Updating "${step.title}"...`, `review-step:${step.id}`);
                    }}
                    disabled={isWorkspaceActionPending}
                    className={cn(
                      "w-full rounded-[1.25rem] border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                      review.steps[step.id] ? "border-emerald-200 bg-emerald-50" : "border-border bg-secondary/30 hover:border-foreground/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 inline-flex size-6 items-center justify-center rounded-full border text-xs", review.steps[step.id] ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-border text-muted-foreground")}>
                        {isPendingButton(`review-step:${step.id}`) ? <LoaderCircle className="size-3.5 animate-spin" /> : review.steps[step.id] ? <Check className="size-3.5" /> : null}
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
                <input
                  value={review.focus}
                  onChange={(event) =>
                    setReview((prev) => ({ ...prev, focus: event.target.value }))
                  }
                  onBlur={() => {
                    void updateReviewState(
                      { focus: review.focus },
                      undefined,
                      "Saving weekly focus...",
                      "review-focus",
                    );
                  }}
                  placeholder="Weekly focus: เป้าหมายหลักของสัปดาห์นี้"
                  disabled={isWorkspaceActionPending}
                  className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                />
                <textarea
                  value={review.notes}
                  onChange={(event) =>
                    setReview((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  onBlur={() => {
                    void updateReviewState(
                      { notes: review.notes },
                      undefined,
                      "Saving review notes...",
                      "review-notes",
                    );
                  }}
                  placeholder="Review notes, bottlenecks, or commitments..."
                  rows={4}
                  disabled={isWorkspaceActionPending}
                  className="w-full rounded-[1.25rem] border border-border px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void updateReviewState(
                      { lastCompletedAt: new Date().toISOString() },
                      "Weekly review marked complete.",
                      "Marking weekly review complete...",
                      "review-complete",
                    );
                  }}
                  disabled={isWorkspaceActionPending}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPendingButton("review-complete") ? <LoaderCircle className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
                  {isPendingButton("review-complete") ? "Saving..." : "Complete review"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void copyWeeklyReviewBrief();
                  }}
                  disabled={isWorkspaceActionPending}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPendingButton("copy-brief") ? <LoaderCircle className="size-4 animate-spin" /> : <Copy className="size-4" />}
                  {isPendingButton("copy-brief") ? "Copying..." : "Copy brief"}
                </button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {review.lastCompletedAt ? `Last completed ${formatShortDate(review.lastCompletedAt)}` : "No weekly review completed yet"}
              </p>
            </section>
          </div>
        </section>
      </main>

      {isKanbanDialogOpen ? (
        <OverlayDialog
          title={selectedItem?.linkedTaskId ? "Create Another Kanban Task" : "Send To Kanban"}
          onClose={() => setIsKanbanDialogOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              Create a Kanban task from this GTD item and keep a link back to the Kanban board.
            </p>
            <div className="rounded-[1.25rem] border border-border bg-secondary/30 px-4 py-4 text-sm leading-7 text-muted-foreground">
              <p className="font-medium text-foreground">ควรใช้เมื่อไหร่</p>
              <p className="mt-1">
                ใช้เมื่อ GTD item นี้ผ่านการ clarify แล้วและควรกลายเป็นงานที่ทีมเห็นร่วมกันบน
                Kanban board ไม่ใช่แค่ reminder ส่วนตัว
              </p>
            </div>

            {isTrackerLoading ? (
              <div className="rounded-[1.25rem] border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                Loading Kanban projects...
              </div>
            ) : trackerProjects.length === 0 ? (
              <div className="space-y-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <p>No Kanban project found yet. Create a project in the Kanban board first.</p>
                <Link
                  href="/todos"
                  className="inline-flex items-center rounded-full border border-amber-300 px-4 py-2 font-medium transition-colors hover:bg-amber-100"
                >
                  Open Kanban board
                </Link>
              </div>
            ) : (
              <>
                <label className="grid gap-2">
                  <span className="caption-editorial text-[0.68rem]">Project</span>
                  <select
                    value={kanbanDraft.projectId}
                    onChange={(event) =>
                      setKanbanDraft((prev) => ({
                        ...prev,
                        projectId: event.target.value,
                      }))
                    }
                    className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
                  >
                    {trackerProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.code} · {project.name} · {phaseLabels[project.phase]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="caption-editorial text-[0.68rem]">Task Type</span>
                  <select
                    value={kanbanDraft.taskType}
                    onChange={(event) =>
                      setKanbanDraft((prev) => ({
                        ...prev,
                        taskType: event.target.value as TrackerTaskType,
                      }))
                    }
                    className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
                  >
                    {Object.entries(taskTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {taskTypeDescriptions[kanbanDraft.taskType]}
                  </p>
                </label>

                <div className="rounded-[1.25rem] border border-border bg-secondary/30 px-4 py-4 text-sm leading-7 text-muted-foreground">
                  <p>Title: {selectedItem?.text ?? "-"}</p>
                  <p>Priority: {selectedItem?.priority ?? "-"}</p>
                  <p>Due date: {selectedItem?.dueDate ? formatShortDate(selectedItem.dueDate) : "No due date"}</p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsKanbanDialogOpen(false)}
                    disabled={isSendingToKanban}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void sendSelectedItemToKanban();
                    }}
                    disabled={isSendingToKanban}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingToKanban ? <LoaderCircle className="size-4 animate-spin" /> : null}
                    {isSendingToKanban ? "Creating..." : "Create in Kanban"}
                  </button>
                </div>
              </>
            )}
          </div>
        </OverlayDialog>
      ) : null}
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

function QuickProcessButton({
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

function LoadingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
      <LoaderCircle className="size-3.5 animate-spin" />
      {label}
    </span>
  );
}

function OverlayDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 p-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
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

function sortItems(a: GtdItem, b: GtdItem) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const order: Record<GtdPriority, number> = { high: 0, medium: 1, low: 2 };
  if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
  if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function sortArchivedItems(a: GtdItem, b: GtdItem) {
  const aDoneAt = a.doneAt ? new Date(a.doneAt).getTime() : 0;
  const bDoneAt = b.doneAt ? new Date(b.doneAt).getTime() : 0;
  if (aDoneAt !== bDoneAt) return bDoneAt - aDoneAt;
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
