import { describe, expect, it } from "vitest";

import {
  reviewActions,
  trackerArtifactKinds,
  trackerPhases,
  trackerTaskStatuses,
  trackerTaskTypes,
} from "@/lib/tracker/constants";
import type { TrackerTaskRecord } from "@/lib/tracker/types";
import {
  filterTasksForSavedView,
  isTaskDueThisWeek,
  isTaskDueToday,
  isTaskOverdue,
} from "@/lib/tracker/views";

function makeTask(partial: Partial<TrackerTaskRecord>): TrackerTaskRecord {
  return {
    id: partial.id ?? crypto.randomUUID(),
    projectId: partial.projectId ?? "project-1",
    phase: partial.phase ?? "design_development",
    taskType: partial.taskType ?? "design",
    title: partial.title ?? "Task",
    description: partial.description ?? "",
    status: partial.status ?? "todo",
    priority: partial.priority ?? "medium",
    assignee: partial.assignee ?? "BNJ Studio",
    dueDate: partial.dueDate ?? null,
    location: partial.location ?? "",
    revision: partial.revision ?? "",
    sourceType: partial.sourceType ?? "manual",
    sourceRef: partial.sourceRef ?? "manual",
    sourceArtifactId: partial.sourceArtifactId ?? null,
    nextAction: partial.nextAction ?? "",
    blocker: partial.blocker ?? "",
    humanVerified: partial.humanVerified ?? true,
    sortOrder: partial.sortOrder ?? 0,
    createdFromReviewId: partial.createdFromReviewId ?? null,
    createdAt: partial.createdAt ?? "2026-03-19T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-03-19T00:00:00.000Z",
    completedAt: partial.completedAt ?? null,
  };
}

describe("tracker enums", () => {
  it("exposes canonical phase, task, artifact, and review action enums", () => {
    expect(trackerPhases).toEqual([
      "concept",
      "schematic",
      "design_development",
      "construction_documents",
      "tender",
      "construction",
      "handover",
    ]);
    expect(trackerTaskStatuses).toEqual(["todo", "doing", "waiting", "blocked", "done"]);
    expect(trackerTaskTypes).toContain("meeting_followup");
    expect(trackerArtifactKinds).toContain("weekly_report");
    expect(reviewActions).toContain("report.weekly");
  });
});

describe("saved view helpers", () => {
  const now = new Date("2026-03-19T09:00:00.000Z");
  const tasks = [
    makeTask({ id: "today", dueDate: "2026-03-19", status: "todo" }),
    makeTask({ id: "overdue", dueDate: "2026-03-18", status: "doing" }),
    makeTask({ id: "week", dueDate: "2026-03-24", status: "waiting", taskType: "rfi" }),
    makeTask({ id: "later", dueDate: "2026-04-02", taskType: "submittal" }),
    makeTask({ id: "done", dueDate: "2026-03-18", status: "done", taskType: "punch_list" }),
  ];

  it("marks due dates consistently", () => {
    expect(isTaskDueToday(tasks[0], now)).toBe(true);
    expect(isTaskOverdue(tasks[1], now)).toBe(true);
    expect(isTaskDueThisWeek(tasks[2], now)).toBe(true);
    expect(isTaskOverdue(tasks[4], now)).toBe(false);
  });

  it("filters today and overdue exactly as defined", () => {
    expect(filterTasksForSavedView(tasks, "today", now).map((task) => task.id)).toEqual([
      "today",
      "overdue",
    ]);
    expect(filterTasksForSavedView(tasks, "overdue", now).map((task) => task.id)).toEqual([
      "overdue",
    ]);
  });

  it("filters weekly and typed saved views", () => {
    expect(filterTasksForSavedView(tasks, "this_week", now).map((task) => task.id)).toEqual([
      "today",
      "week",
    ]);
    expect(filterTasksForSavedView(tasks, "waiting_on", now).map((task) => task.id)).toEqual([
      "week",
    ]);
    expect(filterTasksForSavedView(tasks, "rfis", now).map((task) => task.id)).toEqual([
      "week",
    ]);
    expect(filterTasksForSavedView(tasks, "submittals", now).map((task) => task.id)).toEqual([
      "later",
    ]);
    expect(filterTasksForSavedView(tasks, "punch_list", now)).toHaveLength(1);
  });
});
