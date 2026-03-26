import { ValidationError } from "@/lib/errors";
import { generateArtifactReviewProposals } from "@/lib/tracker/ai";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import {
  createArtifact,
  createReviewItems,
  getProjectFromWorkspace,
  getWorkspaceData,
} from "@/lib/tracker/service";
import { sanitizeFileName } from "@/lib/utils";

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB

function toBase64(arrayBuffer: ArrayBuffer) {
  return Buffer.from(arrayBuffer).toString("base64");
}

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const formData = await request.formData();
    const projectId = String(formData.get("projectId") ?? "");
    const title = String(formData.get("title") ?? "");
    const kind = String(formData.get("kind") ?? "");
    const file = formData.get("file");

    if (!projectId || !title || (kind !== "site_photo" && kind !== "site_markup")) {
      throw new ValidationError("Invalid upload payload");
    }

    if (!(file instanceof File)) {
      throw new ValidationError("Upload file is required");
    }

    if (!file.type.startsWith("image/")) {
      throw new ValidationError("Only image uploads are supported in this endpoint");
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      throw new ValidationError(`File too large: max ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    const bytes = await file.arrayBuffer();
    const objectKey = `tracker/${projectId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    await env.ARTIFACTS_BUCKET.put(objectKey, bytes, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const workspace = await getWorkspaceData(env);
    const project = getProjectFromWorkspace(workspace, projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const artifact = await createArtifact(env, {
      projectId,
      kind,
      title,
      fileName: file.name,
      filePath: objectKey,
      mimeType: file.type,
      extractedSummary: "",
      sourceText: String(formData.get("notes") ?? ""),
      metadataJson: JSON.stringify({
        intake: kind,
        objectKey,
      }),
    });

    const generation = await generateArtifactReviewProposals({
      env,
      artifact,
      project,
      workspace,
      imageDataUrl: `data:${file.type};base64,${toBase64(bytes)}`,
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
