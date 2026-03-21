import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { createClientRoomProject, listClientRoomProjects } from "@/lib/client-rooms/service";

export async function GET() {
  try {
    const env = await getTrackerEnv();
    const projects = await listClientRoomProjects(env);
    return createJsonResponse({ projects });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const env = await getTrackerEnv();
    const payload = (await request.json()) as { title?: string };
    const project = await createClientRoomProject(env, payload);
    return createJsonResponse({ project }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
