import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { getGtdWorkspaceData } from "@/lib/gtd/service";

export async function GET() {
  try {
    const env = await getTrackerEnv();
    const workspace = await getGtdWorkspaceData(env);
    return createJsonResponse({ workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
