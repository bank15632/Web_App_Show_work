import { buildWeeklyReportReview } from "@/lib/tracker/ai";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { weeklyReportSchema } from "@/lib/tracker/schemas";
import { createReviewItems, getWorkspaceData } from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = weeklyReportSchema.parse(await request.json());
    const workspace = await getWorkspaceData(env);
    const proposal = buildWeeklyReportReview(workspace, payload.projectId);
    const reviewItems = await createReviewItems(env, [proposal]);
    return createJsonResponse({
      reviewItems,
      workspace: await getWorkspaceData(env),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
