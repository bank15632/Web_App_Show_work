import { NextResponse } from "next/server";

import { getTrackerEnv } from "@/lib/tracker/runtime";
import { getClientRoomAssetById } from "@/lib/client-rooms/service";

type ClientRoomAssetRouteProps = {
  params: Promise<{ assetId: string }>;
};

function createBodyStream(body: unknown) {
  const reader = (
    body as {
      getReader: () => ReadableStreamDefaultReader<Uint8Array>;
    }
  ).getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      controller.enqueue(value);
    },
    async cancel(reason) {
      await reader.cancel(reason);
    },
  });
}

export async function GET(_: Request, { params }: ClientRoomAssetRouteProps) {
  const env = await getTrackerEnv();
  const { assetId } = await params;
  const asset = await getClientRoomAssetById(env, assetId);

  if (!asset) {
    return new NextResponse("Asset not found", { status: 404 });
  }

  const object = await env.ARTIFACTS_BUCKET.get(asset.objectKey);
  if (!object || !object.body) {
    return new NextResponse("Asset not found", { status: 404 });
  }

  const headers = new Headers({
    "content-type": asset.mimeType || "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "content-disposition": `inline; filename="${asset.fileName}"`,
  });

  headers.set("etag", object.httpEtag);
  headers.set("content-length", String(object.size));
  headers.set("last-modified", object.uploaded.toUTCString());

  return new NextResponse(createBodyStream(object.body), { headers });
}
