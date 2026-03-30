import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { decisionMutationSchema } from "@/lib/tracker/schemas";
import { deleteDecision, getWorkspaceData, updateDecision } from "@/lib/tracker/service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string; decisionId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { decisionId } = await context.params;
    const payload = decisionMutationSchema.parse(await request.json());
    const decision = await updateDecision(env, decisionId, payload);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ decision, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string; decisionId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { decisionId } = await context.params;
    const deleted = await deleteDecision(env, decisionId);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ deleted, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
