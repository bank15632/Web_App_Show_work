import { NextResponse } from "next/server";

import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import {
  deleteClientRoomProject,
  getClientRoomProjectById,
  listClientRoomProjects,
  saveClientRoomProject,
} from "@/lib/client-rooms/service";

type ProjectRouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_: Request, { params }: ProjectRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const project = await getClientRoomProjectById(env, projectId);

    if (!project) {
      return NextResponse.json({ error: "Client room not found" }, { status: 404 });
    }

    return createJsonResponse({ project });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: ProjectRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const payload = (await request.json()) as { draftData?: unknown };
    const project = await saveClientRoomProject(env, projectId, payload.draftData);
    return createJsonResponse({ project });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: ProjectRouteProps) {
  try {
    const env = await getTrackerEnv();
    const { projectId } = await params;
    const deleted = await deleteClientRoomProject(env, projectId);
    const projects = await listClientRoomProjects(env);

    return createJsonResponse({ deleted, projects });
  } catch (error) {
    return createErrorResponse(error);
  }
}
