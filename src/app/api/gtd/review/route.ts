import { gtdReviewPatchSchema } from "@/lib/gtd/schemas";
import { getGtdWorkspaceData, updateGtdReview } from "@/lib/gtd/service";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";

export async function PATCH(request: Request) {
  try {
    const env = await getTrackerEnv();
    const body = (await request.json()) as { review: unknown };
    const review = await updateGtdReview(env, gtdReviewPatchSchema.parse(body.review));
    const workspace = await getGtdWorkspaceData(env);
    return createJsonResponse({ review, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
