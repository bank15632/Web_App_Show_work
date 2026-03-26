import {
  assertClientRoomExists,
  createClientRoomAssetRecord,
} from "@/lib/client-rooms/service";
import type { ClientRoomAssetKind } from "@/lib/client-rooms/types";
import { ValidationError } from "@/lib/errors";
import {
  createErrorResponse,
  createJsonResponse,
  getTrackerEnv,
} from "@/lib/tracker/runtime";

type CompleteMultipartRouteProps = {
  params: Promise<{ projectId: string }>;
};

interface UploadedPart {
  partNumber: number;
  etag: string;
}

const allowedKinds = new Set<ClientRoomAssetKind>(["hero", "gallery", "document"]);

function assertObjectKey(projectId: string, objectKey: string) {
  if (!objectKey.startsWith(`client-rooms/${projectId}/`)) {
    throw new ValidationError("Invalid upload key");
  }
}

function isUploadedPart(value: unknown): value is UploadedPart {
  if (!value || typeof value !== "object") {
    return false;
  }

  const part = value as Partial<UploadedPart>;
  const partNumber =
    typeof part.partNumber === "number" && Number.isInteger(part.partNumber)
      ? part.partNumber
      : null;

  return partNumber !== null && partNumber > 0 && typeof part.etag === "string";
}

export async function POST(request: Request, { params }: CompleteMultipartRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const payload = (await request.json()) as {
      kind?: ClientRoomAssetKind;
      fileName?: string;
      mimeType?: string;
      key?: string;
      uploadId?: string;
      parts?: UploadedPart[];
    };

    if (
      !payload.kind ||
      !payload.fileName ||
      !payload.mimeType ||
      !payload.key ||
      !payload.uploadId ||
      !payload.parts ||
      payload.parts.length === 0
    ) {
      throw new ValidationError("Invalid multipart complete payload");
    }

    if (!allowedKinds.has(payload.kind)) {
      throw new ValidationError("Invalid asset kind");
    }

    if (!payload.parts.every(isUploadedPart)) {
      throw new ValidationError("Invalid multipart parts");
    }

    await assertClientRoomExists(env, projectId);
    assertObjectKey(projectId, payload.key);

    const multipartUpload = env.ARTIFACTS_BUCKET.resumeMultipartUpload(
      payload.key,
      payload.uploadId,
    );

    await multipartUpload.complete(
      [...payload.parts].sort((a, b) => a.partNumber - b.partNumber),
    );

    const result = await createClientRoomAssetRecord(env, {
      projectId,
      kind: payload.kind,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      objectKey: payload.key,
    });

    return createJsonResponse(result, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
