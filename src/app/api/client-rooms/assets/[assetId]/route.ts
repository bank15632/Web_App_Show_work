import { NextResponse } from "next/server";

import { getTrackerEnv } from "@/lib/tracker/runtime";
import { getClientRoomAssetById } from "@/lib/client-rooms/service";

type ClientRoomAssetRouteProps = {
  params: Promise<{ assetId: string }>;
};

type AssetRange =
  | {
      offset: number;
      length?: number;
    }
  | {
      offset?: number;
      length: number;
    }
  | {
      suffix: number;
    };

function parseRangeHeader(value: string | null): AssetRange | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) {
    return null;
  }

  const [, rawStart, rawEnd] = match;

  if (rawStart && rawEnd) {
    const start = Number(rawStart);
    const end = Number(rawEnd);

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
      return null;
    }

    return {
      offset: start,
      length: end - start + 1,
    };
  }

  if (rawStart) {
    const start = Number(rawStart);

    if (!Number.isFinite(start) || start < 0) {
      return null;
    }

    return { offset: start };
  }

  if (rawEnd) {
    const suffix = Number(rawEnd);

    if (!Number.isFinite(suffix) || suffix <= 0) {
      return null;
    }

    return { suffix };
  }

  return null;
}

function resolveRangeBounds(range: AssetRange, totalSize: number) {
  if ("suffix" in range) {
    const length = Math.min(range.suffix, totalSize);
    const start = Math.max(0, totalSize - length);

    return {
      start,
      end: start + Math.max(0, length - 1),
      length,
    };
  }

  const start = Math.max(0, range.offset ?? 0);
  const requestedLength =
    typeof range.length === "number" ? range.length : Math.max(0, totalSize - start);
  const length = Math.min(requestedLength, Math.max(0, totalSize - start));

  return {
    start,
    end: start + Math.max(0, length - 1),
    length,
  };
}

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

  const requestedRange = includeBody ? parseRangeHeader(request.headers.get("range")) : null;
  const object = includeBody
    ? await env.ARTIFACTS_BUCKET.get(
        asset.objectKey,
        requestedRange ? { range: requestedRange } : undefined,
      )
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
  headers.set("accept-ranges", "bytes");
  headers.set("etag", object.httpEtag);
  headers.set("last-modified", object.uploaded.toUTCString());

  const responseRange = includeBody && object.range ? resolveRangeBounds(object.range as AssetRange, object.size) : null;
  if (responseRange && responseRange.length > 0) {
    headers.set(
      "content-range",
      `bytes ${responseRange.start}-${responseRange.end}/${object.size}`,
    );
    headers.set("content-length", String(responseRange.length));
  }

  return new Response(includeBody && "body" in object ? (object.body as unknown as BodyInit) : null, {
    status: responseRange ? 206 : 200,
    headers,
  });
}

export async function GET(request: Request, props: ClientRoomAssetRouteProps) {
  return buildAssetResponse(request, props, true);
}

export async function HEAD(request: Request, props: ClientRoomAssetRouteProps) {
  return buildAssetResponse(request, props, false);
}
