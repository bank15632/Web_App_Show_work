import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { decisionMutationSchema } from "@/lib/tracker/schemas";
import { createDecision, getWorkspaceData } from "@/lib/tracker/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await context.params;
    const payload = decisionMutationSchema.parse(await request.json());
    const decision = await createDecision(env, projectId, payload);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ decision, workspace }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
