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
    return new NextResponse("Asset not found", { status: 404 });
  }

  const object = await env.ARTIFACTS_BUCKET.get(asset.objectKey);
  if (!object || !object.body) {
    return new NextResponse("Asset not found", { status: 404 });
  }

  return new NextResponse(await object.arrayBuffer(), {
    headers: {
      "content-type": asset.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": `inline; filename="${asset.fileName}"`,
    },
  });
}
