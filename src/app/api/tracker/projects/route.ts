import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { projectMutationSchema } from "@/lib/tracker/schemas";
import { createProject, getWorkspaceData } from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = projectMutationSchema.parse(await request.json());
    const project = await createProject(env, payload);
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ project, workspace }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
