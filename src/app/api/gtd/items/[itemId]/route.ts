import { gtdItemPatchSchema } from "@/lib/gtd/schemas";
import { deleteGtdItem, getGtdWorkspaceData, updateGtdItem } from "@/lib/gtd/service";
import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { itemId } = await context.params;
    const body = (await request.json()) as { item: unknown };
    const item = await updateGtdItem(env, itemId, gtdItemPatchSchema.parse(body.item));
    const workspace = await getGtdWorkspaceData(env);
    return createJsonResponse({ item, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const env = await getTrackerEnv();
    const { itemId } = await context.params;
    const deleted = await deleteGtdItem(env, itemId);
    const workspace = await getGtdWorkspaceData(env);
    return createJsonResponse({ deleted, workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
