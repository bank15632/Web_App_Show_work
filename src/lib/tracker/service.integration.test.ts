import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { buildWeeklyReportReview } from "@/lib/tracker/ai";
import {
  answerWorkspaceQuery,
  createReviewItems,
  createTask,
  deleteTask,
  getWorkspaceData,
  resolveReviewItemApproval,
  resolveReviewItemRejection,
  updateTask,
} from "@/lib/tracker/service";
import type { TrackerReviewProposal } from "@/lib/tracker/types";

describe("tracker service integration", () => {
  it("seeds the workspace from existing portal data", async () => {
    const workspace = await getWorkspaceData(env);
    expect(workspace.projects.length).toBeGreaterThan(0);
    expect(workspace.projects.some((project) => project.code === "B7X2")).toBe(true);
  });

  it("supports task CRUD against D1", async () => {
    const workspace = await getWorkspaceData(env);
    const project = workspace.projects[0];

    const created = await createTask(env, project.id, {
      phase: project.phase,
      taskType: "design",
      title: "Test CRUD task",
      description: "Created inside integration test",
      status: "todo",
      priority: "medium",
      assignee: "BNJ Studio",
      dueDate: "2026-03-25",
      location: "",
      revision: "",
      sourceType: "test",
      sourceRef: "crud",
      sourceArtifactId: null,
      nextAction: "",
      blocker: "",
      humanVerified: true,
    });

    expect(created.title).toBe("Test CRUD task");

    const updated = await updateTask(env, created.id, {
      status: "blocked",
      blocker: "Waiting for consultant reply",
    });

    expect(updated.status).toBe("blocked");
    expect(updated.blocker).toContain("consultant");

    const deleted = await deleteTask(env, created.id);
    expect(deleted).toBe(true);
  });

  it("keeps AI changes review-gated for approve and reject paths", async () => {
    const workspace = await getWorkspaceData(env);
    const project = workspace.projects[0];
    const approveProposal: TrackerReviewProposal = {
      version: "v1",
      action: "task.create",
      projectId: project.id,
      sourceArtifactId: null,
      confidence: 0.8,
      reasoningSummary: "Test approval flow.",
      entity: {
        phase: project.phase,
        taskType: "coordination",
        title: "Approved review task",
        description: "Created via review approval",
        status: "todo",
        priority: "high",
        assignee: "BNJ Studio",
        dueDate: null,
        location: "",
        revision: "",
        sourceType: "test.review",
        sourceRef: "approve",
        sourceArtifactId: null,
        nextAction: "",
        blocker: "",
        humanVerified: false,
      },
    };

    const rejectProposal: TrackerReviewProposal = {
      ...approveProposal,
      reasoningSummary: "Test rejection flow.",
      entity: {
        ...(approveProposal.entity as Record<string, unknown>),
        title: "Rejected review task",
        sourceRef: "reject",
      },
    };

    const [approvedItem, rejectedItem] = await createReviewItems(env, [
      approveProposal,
      rejectProposal,
    ]);

    const approved = await resolveReviewItemApproval(env, approvedItem.id, "tester");
    const rejected = await resolveReviewItemRejection(
      env,
      rejectedItem.id,
      "Not needed",
      "tester",
    );

    expect(approved.reviewItem.status).toBe("approved");
    expect(
      approved.workspace.projects
        .flatMap((item) => item.tasks)
        .some((task) => task.title === "Approved review task"),
    ).toBe(true);

    expect(rejected.reviewItem.status).toBe("rejected");
    expect(
      rejected.workspace.projects
        .flatMap((item) => item.tasks)
        .some((task) => task.title === "Rejected review task"),
    ).toBe(false);
  });

  it("queues and approves weekly reports, then answers NL queries over approved data", async () => {
    let workspace = await getWorkspaceData(env);
    const project = workspace.projects[0];

    await createTask(env, project.id, {
      phase: project.phase,
      taskType: "coordination",
      title: "Blocked consultant response",
      description: "Waiting for MEP consultant",
      status: "blocked",
      priority: "high",
      assignee: "BNJ Studio",
      dueDate: "2026-03-20",
      location: "",
      revision: "",
      sourceType: "test",
      sourceRef: "query",
      sourceArtifactId: null,
      nextAction: "",
      blocker: "Consultant has not replied",
      humanVerified: true,
    });

    workspace = await getWorkspaceData(env);
    const proposal = buildWeeklyReportReview(workspace, project.id);
    const [reviewItem] = await createReviewItems(env, [proposal]);
    const approval = await resolveReviewItemApproval(env, reviewItem.id, "tester");

    expect(
      approval.workspace.projects
        .find((item) => item.id === project.id)
        ?.artifacts.some((artifact) => artifact.kind === "weekly_report"),
    ).toBe(true);

    const answer = await answerWorkspaceQuery(env, "blocked", project.id);
    expect(answer.answer.toLowerCase()).toContain("matched");
    expect(answer.snippets.some((snippet) => snippet.includes("Blocked consultant response"))).toBe(
      true,
    );
  });
});
