import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { taskReorderSchema } from "@/lib/tracker/schemas";
import { reorderTasks } from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = taskReorderSchema.parse(await request.json());
    const workspace = await reorderTasks(env, payload.projectId, payload.tasks);
    return createJsonResponse({ workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
