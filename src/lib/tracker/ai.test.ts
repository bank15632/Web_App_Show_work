import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { generateArtifactReviewProposals } from "@/lib/tracker/ai";
import { createArtifact, createProject, getWorkspaceData } from "@/lib/tracker/service";

async function createTestProject(name: string) {
  return createProject(env, {
    name,
    code: "AITEST",
    clientName: "BNJ Studio",
    projectType: "Internal",
    location: "Bangkok",
    phase: "concept",
    status: "active",
    overview: "",
    nextMilestone: "",
    ownerNote: "",
    area: "",
    year: "2026",
  });
}

describe("AI proposal normalization", () => {
  it("normalizes meeting-note proposals into review payloads", async () => {
    const project = await createTestProject("Meeting note AI project");
    const workspace = await getWorkspaceData(env);
    const projectDetail = workspace.projects.find((entry) => entry.id === project.id)!;
    const artifact = await createArtifact(env, {
      projectId: projectDetail.id,
      kind: "meeting_note",
      title: "Weekly coordination",
      sourceText: "- Follow up with MEP consultant\n- Client approved warm oak finish",
      extractedSummary: "",
      metadataJson: "{}",
    });

    const result = await generateArtifactReviewProposals({
      env,
      artifact,
      project: projectDetail,
      workspace,
    });

    expect(result.provider).toBe("heuristic");
    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.proposals.every((proposal) => proposal.version === "v1")).toBe(true);
    expect(result.proposals.every((proposal) => proposal.projectId === projectDetail.id)).toBe(true);
    expect(result.proposals.every((proposal) => proposal.sourceArtifactId === artifact.id)).toBe(true);
  });

  it("suggests a site issue task for site photos", async () => {
    const project = await createTestProject("Site photo AI project");
    const workspace = await getWorkspaceData(env);
    const projectDetail = workspace.projects.find((entry) => entry.id === project.id)!;
    await env.ARTIFACTS_BUCKET.put("tracker/test-site.png", "binary");
    const artifact = await createArtifact(env, {
      projectId: projectDetail.id,
      kind: "site_photo",
      title: "Level 2 ceiling issue",
      filePath: "tracker/test-site.png",
      mimeType: "image/png",
      sourceText: "Ceiling joint is misaligned near corridor.",
      extractedSummary: "",
      metadataJson: "{}",
    });

    const result = await generateArtifactReviewProposals({
      env,
      artifact,
      project: projectDetail,
      workspace,
      imageDataUrl: "data:image/png;base64,ZmFrZQ==",
    });

    expect(
      result.proposals.some(
        (proposal) =>
          proposal.action === "task.create" &&
          (proposal.entity as { taskType?: string }).taskType === "site_issue",
      ),
    ).toBe(true);
  });

  it("always generates an artifact summary proposal for drawing revisions", async () => {
    const project = await createTestProject("Drawing revision AI project");
    const workspace = await getWorkspaceData(env);
    const projectDetail = workspace.projects.find((entry) => entry.id === project.id)!;
    const artifact = await createArtifact(env, {
      projectId: projectDetail.id,
      kind: "drawing_revision",
      title: "Rev 04 interior package",
      sourceText: "Partition at pantry moved 200mm. Door schedule updated.",
      extractedSummary: "",
      metadataJson: "{}",
    });

    const result = await generateArtifactReviewProposals({
      env,
      artifact,
      project: projectDetail,
      workspace,
    });

    expect(result.proposals[0]?.action).toBe("artifact.summary");
  });
});
