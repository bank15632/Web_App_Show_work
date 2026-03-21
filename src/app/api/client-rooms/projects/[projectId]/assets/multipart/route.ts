import { NextResponse } from "next/server";

import {
  assertClientRoomExists,
  createClientRoomObjectKey,
} from "@/lib/client-rooms/service";
import type { ClientRoomAssetKind } from "@/lib/client-rooms/types";
import {
  createErrorResponse,
  createJsonResponse,
  getTrackerEnv,
} from "@/lib/tracker/runtime";

type MultipartRouteProps = {
  params: Promise<{ projectId: string }>;
};

const allowedKinds = new Set<ClientRoomAssetKind>(["hero", "gallery", "document"]);
const multipartChunkSize = 10 * 1024 * 1024;

function assertObjectKey(projectId: string, objectKey: string) {
  if (!objectKey.startsWith(`client-rooms/${projectId}/`)) {
    throw new Error("Invalid upload key");
  }
}

export async function POST(request: Request, { params }: MultipartRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const payload = (await request.json()) as {
      kind?: ClientRoomAssetKind;
      fileName?: string;
      mimeType?: string;
    };

    if (!payload.fileName || !payload.mimeType || !payload.kind) {
      throw new Error("Invalid multipart payload");
    }

    if (!allowedKinds.has(payload.kind)) {
      throw new Error("Invalid asset kind");
    }

    if (
      (payload.kind === "hero" || payload.kind === "gallery") &&
      !payload.mimeType.startsWith("image/")
    ) {
      throw new Error("Hero and gallery uploads must be images");
    }

    await assertClientRoomExists(env, projectId);

    const objectKey = createClientRoomObjectKey(projectId, payload.fileName);
    const multipartUpload = await env.ARTIFACTS_BUCKET.createMultipartUpload(objectKey, {
      httpMetadata: {
        contentType: payload.mimeType,
      },
      customMetadata: {
        projectId,
        kind: payload.kind,
      },
    });

    return createJsonResponse({
      uploadId: multipartUpload.uploadId,
      key: multipartUpload.key,
      partSize: multipartChunkSize,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: MultipartRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");
    const key = url.searchParams.get("key");
    const partNumber = Number(url.searchParams.get("partNumber"));

    if (!uploadId || !key || !Number.isInteger(partNumber) || partNumber < 1) {
      throw new Error("Invalid multipart part payload");
    }

    await assertClientRoomExists(env, projectId);
    assertObjectKey(projectId, key);

    const chunk = await request.arrayBuffer();
    if (chunk.byteLength === 0) {
      throw new Error("Missing upload body");
    }

    const multipartUpload = env.ARTIFACTS_BUCKET.resumeMultipartUpload(key, uploadId);
    const part = await multipartUpload.uploadPart(partNumber, chunk);

    return createJsonResponse({ part });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: MultipartRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");
    const key = url.searchParams.get("key");

    if (!uploadId || !key) {
      throw new Error("Invalid multipart abort payload");
    }

    await assertClientRoomExists(env, projectId);
    assertObjectKey(projectId, key);

    const multipartUpload = env.ARTIFACTS_BUCKET.resumeMultipartUpload(key, uploadId);
    await multipartUpload.abort();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
