import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { deleteTask, getWorkspaceData, updateTask } from "@/lib/tracker/service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { taskId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const task = await updateTask(env, taskId, payload);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ task, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { taskId } = await context.params;
    const deleted = await deleteTask(env, taskId);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ deleted, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
