import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import type { TrackerEnv } from "@/lib/tracker/env";

export async function getTrackerEnv(): Promise<TrackerEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as TrackerEnv;
}

export function createJsonResponse(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected error";

  return NextResponse.json({ error: message }, { status: 500 });
}
