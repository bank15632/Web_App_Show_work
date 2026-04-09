import { NextResponse } from "next/server";

import { getTrackerEnv } from "@/lib/tracker/runtime";
import { getClientRoomAssetById } from "@/lib/client-rooms/service";

type ClientRoomAssetRouteProps = {
  params: Promise<{ assetId: string }>;
};

type AssetBodyObject = {
  body: unknown;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

async function buildAssetResponse(
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
    ? await env.ARTIFACTS_BUCKET.get(asset.objectKey)
    : await env.ARTIFACTS_BUCKET.head(asset.objectKey);

  if (!object) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const safeFileName = asset.fileName.replace(/[\\"]/g, "_");
  const encodedFileName = encodeURIComponent(asset.fileName);

  const headers = new Headers();
  if (object.httpMetadata?.contentType) {
    headers.set("content-type", object.httpMetadata.contentType);
  }
  if (object.httpMetadata?.contentLanguage) {
    headers.set("content-language", object.httpMetadata.contentLanguage);
  }
  if (object.httpMetadata?.contentEncoding) {
    headers.set("content-encoding", object.httpMetadata.contentEncoding);
  }
  if (object.httpMetadata?.cacheControl) {
    headers.set("cache-control", object.httpMetadata.cacheControl);
  }

  headers.set("content-type", asset.mimeType || headers.get("content-type") || "application/octet-stream");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("content-disposition", `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
  headers.set("etag", object.httpEtag);
  headers.set("last-modified", object.uploaded.toUTCString());
  headers.set("content-length", String(object.size));

  if (!includeBody) {
    return new Response(null, { status: 200, headers });
  }

  if (!("body" in object) || !("arrayBuffer" in object)) {
    return NextResponse.json({ error: "Asset body missing" }, { status: 404 });
  }

  const bodyObject = object as typeof object & AssetBodyObject;
  const bytes = await bodyObject.arrayBuffer();
  return new Response(bytes, { status: 200, headers });
}

export async function GET(_: Request, props: ClientRoomAssetRouteProps) {
  return buildAssetResponse(props, true);
}

export async function HEAD(_: Request, props: ClientRoomAssetRouteProps) {
  return buildAssetResponse(props, false);
}
