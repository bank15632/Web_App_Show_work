import { NextResponse } from "next/server";

import { getTrackerEnv } from "@/lib/tracker/runtime";
import { getClientRoomAssetById } from "@/lib/client-rooms/service";

type ClientRoomAssetRouteProps = {
  params: Promise<{ assetId: string }>;
};

export async function GET(_: Request, { params }: ClientRoomAssetRouteProps) {
  const env = await getTrackerEnv();
  const { assetId } = await params;
  const asset = await getClientRoomAssetById(env, assetId);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const object = await env.ARTIFACTS_BUCKET.get(asset.objectKey);
  if (!object || !object.body) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const safeFileName = asset.fileName.replace(/[\\"]/g, "_");
  const encodedFileName = encodeURIComponent(asset.fileName);

  const headers = new Headers({
    "content-type": asset.mimeType || "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "content-disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
  });

  headers.set("etag", object.httpEtag);
  headers.set("content-length", String(object.size));
  headers.set("last-modified", object.uploaded.toUTCString());

  return new Response(object.body as unknown as BodyInit, { headers });
}
