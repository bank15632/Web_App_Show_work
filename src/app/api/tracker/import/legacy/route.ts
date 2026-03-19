import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { legacyImportSchema } from "@/lib/tracker/schemas";
import { importLegacyTodos } from "@/lib/tracker/service";

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = legacyImportSchema.parse(await request.json());
    const workspace = await importLegacyTodos(env, payload.items);
    return createJsonResponse({ workspace });
  } catch (error) {
    return createErrorResponse(error);
  }
}
