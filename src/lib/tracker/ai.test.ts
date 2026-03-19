import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { generateArtifactReviewProposals } from "@/lib/tracker/ai";
import { createArtifact, getWorkspaceData } from "@/lib/tracker/service";

describe("AI proposal normalization", () => {
  it("normalizes meeting-note proposals into review payloads", async () => {
    const workspace = await getWorkspaceData(env);
    const project = workspace.projects[0];
    const artifact = await createArtifact(env, {
      projectId: project.id,
      kind: "meeting_note",
      title: "Weekly coordination",
      sourceText: "- Follow up with MEP consultant\n- Client approved warm oak finish",
      extractedSummary: "",
      metadataJson: "{}",
    });

    const result = await generateArtifactReviewProposals({
      env,
      artifact,
      project,
      workspace,
    });

    expect(result.provider).toBe("heuristic");
    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.proposals.every((proposal) => proposal.version === "v1")).toBe(true);
    expect(result.proposals.every((proposal) => proposal.projectId === project.id)).toBe(true);
    expect(result.proposals.every((proposal) => proposal.sourceArtifactId === artifact.id)).toBe(true);
  });

  it("suggests a site issue task for site photos", async () => {
    const workspace = await getWorkspaceData(env);
    const project = workspace.projects[0];
    await env.ARTIFACTS_BUCKET.put("tracker/test-site.png", "binary");
    const artifact = await createArtifact(env, {
      projectId: project.id,
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
      project,
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
    const workspace = await getWorkspaceData(env);
    const project = workspace.projects[0];
    const artifact = await createArtifact(env, {
      projectId: project.id,
      kind: "drawing_revision",
      title: "Rev 04 interior package",
      sourceText: "Partition at pantry moved 200mm. Door schedule updated.",
      extractedSummary: "",
      metadataJson: "{}",
    });

    const result = await generateArtifactReviewProposals({
      env,
      artifact,
      project,
      workspace,
    });

    expect(result.proposals[0]?.action).toBe("artifact.summary");
  });
});
