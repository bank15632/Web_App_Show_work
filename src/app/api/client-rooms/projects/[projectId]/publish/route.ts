import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import { buildClientRoomSharePath } from "@/lib/client-rooms/types";
import { publishClientRoomProject } from "@/lib/client-rooms/service";

type PublishRouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function POST(_: Request, { params }: PublishRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const project = await publishClientRoomProject(env, projectId);

    return createJsonResponse({
      project,
      sharePath: project.shareToken ? buildClientRoomSharePath(project.shareToken) : null,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
