import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import type { TrackerEnv } from "@/lib/tracker/env";

export async function getTrackerEnv(): Promise<TrackerEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as TrackerEnv;
}

export function createJsonResponse(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function createErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unexpected tracker error";

  return NextResponse.json(
    {
      error: message,
    },
    {
      status: 500,
    },
  );
}
