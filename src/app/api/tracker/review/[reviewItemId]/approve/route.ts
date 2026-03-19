import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { resolveReviewItemApproval } from "@/lib/tracker/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ reviewItemId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { reviewItemId } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as { reviewedBy?: string };
    const resolution = await resolveReviewItemApproval(
      env,
      reviewItemId,
      payload.reviewedBy,
    );
    return createJsonResponse(resolution);
  } catch (error) {
    return createErrorResponse(error);
  }
}
