import { gtdItemCreateSchema } from "@/lib/gtd/schemas";
import { createGtdItem, getGtdWorkspaceData } from "@/lib/gtd/service";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const body = (await request.json()) as { item: unknown };
    const item = await createGtdItem(env, gtdItemCreateSchema.parse(body.item));
    const workspace = await getGtdWorkspaceData(env);
    return createJsonResponse({ item, workspace }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
