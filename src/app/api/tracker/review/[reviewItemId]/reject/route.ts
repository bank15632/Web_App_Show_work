import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { reviewRejectSchema } from "@/lib/tracker/schemas";
import { resolveReviewItemRejection } from "@/lib/tracker/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ reviewItemId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { reviewItemId } = await context.params;
    const payload = reviewRejectSchema.parse(await request.json());
    const resolution = await resolveReviewItemRejection(
      env,
      reviewItemId,
      payload.reason,
      payload.reviewedBy,
    );
    return createJsonResponse(resolution);
  } catch (error) {
    return createErrorResponse(error);
  }
}
