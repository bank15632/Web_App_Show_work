import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { taskMutationSchema } from "@/lib/tracker/schemas";
import { createTask, getWorkspaceData } from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const body = (await request.json()) as {
      projectId: string;
      task: unknown;
    };
    const task = await createTask(
      env,
      body.projectId,
      taskMutationSchema.parse(body.task),
    );
    const workspace = await getWorkspaceData(env);
    return createJsonResponse({ task, workspace }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
