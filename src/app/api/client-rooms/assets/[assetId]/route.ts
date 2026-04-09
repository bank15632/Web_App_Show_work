import { NextResponse } from "next/server";

import { getTrackerEnv } from "@/lib/tracker/runtime";
import { getClientRoomAssetById } from "@/lib/client-rooms/service";

type ClientRoomAssetRouteProps = {
  params: Promise<{ assetId: string }>;
};

async function buildAssetResponse(
  request: Request,
  { params }: ClientRoomAssetRouteProps,
  includeBody: boolean,
) {
  const env = await getTrackerEnv();
  const { assetId } = await params;
  const asset = await getClientRoomAssetById(env, assetId);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const object = includeBody
    ? await env.ARTIFACTS_BUCKET.get(asset.objectKey, {
        range: request.headers,
      })
    : await env.ARTIFACTS_BUCKET.head(asset.objectKey);

  if (!object) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const safeFileName = asset.fileName.replace(/[\\"]/g, "_");
  const encodedFileName = encodeURIComponent(asset.fileName);

  const headers = new Headers();
  object.writeHttpMetadata(headers);

  headers.set("content-type", asset.mimeType || headers.get("content-type") || "application/octet-stream");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("content-disposition", `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
  headers.set("accept-ranges", "bytes");
  headers.set("etag", object.httpEtag);
  headers.set("last-modified", object.uploaded.toUTCString());

  return new Response(includeBody && "body" in object ? (object.body as unknown as BodyInit) : null, {
    status: 200,
    headers,
  });
}

export async function GET(request: Request, props: ClientRoomAssetRouteProps) {
  return buildAssetResponse(request, props, true);
}

export async function HEAD(request: Request, props: ClientRoomAssetRouteProps) {
  return buildAssetResponse(request, props, false);
}
