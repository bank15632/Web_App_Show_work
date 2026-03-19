import { answerTrackerQueryWithAi } from "@/lib/tracker/ai";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { trackerQuerySchema } from "@/lib/tracker/schemas";
import { getWorkspaceData } from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = trackerQuerySchema.parse(await request.json());
    const workspace = await getWorkspaceData(env);
    const result = await answerTrackerQueryWithAi(
      env,
      workspace,
      payload.question,
      payload.projectId,
    );
    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
