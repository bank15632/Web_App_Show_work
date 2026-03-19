import { createErrorResponse, createJsonResponse } from "@/lib/tracker/runtime";
import { getWorkspaceData, ensureTrackerReady } from "@/lib/tracker/service";
import { getTrackerEnv } from "@/lib/tracker/runtime";

export async function GET() {
  try {
    const env = await getTrackerEnv();
    await ensureTrackerReady(env);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
