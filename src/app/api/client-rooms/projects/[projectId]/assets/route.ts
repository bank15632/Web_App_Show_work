import { ValidationError } from "@/lib/errors";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { createClientRoomAsset } from "@/lib/client-rooms/service";
import type { ClientRoomAssetKind } from "@/lib/client-rooms/types";

type AssetRouteProps = {
  params: Promise<{ projectId: string }>;
};

const allowedKinds = new Set<ClientRoomAssetKind>(["hero", "gallery", "document"]);
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request, { params }: AssetRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const formData = await request.formData();
    const kind = String(formData.get("kind") ?? "") as ClientRoomAssetKind;
    const file = formData.get("file");

    if (!allowedKinds.has(kind)) {
      throw new ValidationError("Invalid asset kind");
    }

    if (!(file instanceof File)) {
      throw new ValidationError("Upload file is required");
    }

    if ((kind === "hero" || kind === "gallery") && !file.type.startsWith("image/")) {
      throw new ValidationError("Hero and gallery uploads must be images");
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      throw new ValidationError(`File too large: max ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    const result = await createClientRoomAsset(env, {
      projectId,
      kind,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes: await file.arrayBuffer(),
    });

    return createJsonResponse(result, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
