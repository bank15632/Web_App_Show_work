import { generateArtifactReviewProposals } from "@/lib/tracker/ai";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { meetingNoteIngestSchema } from "@/lib/tracker/schemas";
import {
  createArtifact,
  createReviewItems,
  getProjectFromWorkspace,
  getWorkspaceData,
} from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = meetingNoteIngestSchema.parse(await request.json());
    const workspace = await getWorkspaceData(env);
    const project = getProjectFromWorkspace(workspace, payload.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const artifact = await createArtifact(env, {
      projectId: payload.projectId,
      kind: "meeting_note",
      title: payload.title,
      extractedSummary: "",
      sourceText: payload.content,
      metadataJson: JSON.stringify({ intake: "meeting_note" }),
    });

    const generation = await generateArtifactReviewProposals({
      env,
      artifact,
      project,
      workspace,
    });
    const reviewItems = await createReviewItems(env, generation.proposals);

    return createJsonResponse({
      artifact,
      reviewItems,
      provider: generation.provider,
      workspace: await getWorkspaceData(env),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
