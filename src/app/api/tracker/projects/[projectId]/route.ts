import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { deleteProject, getWorkspaceData, updateProject } from "@/lib/tracker/service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const project = await updateProject(env, projectId, payload);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ project, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await context.params;
    const deleted = await deleteProject(env, projectId);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ deleted, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
