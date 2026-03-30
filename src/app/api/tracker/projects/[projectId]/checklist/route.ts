import { createErrorResponse, createJsonResponse, getTrackerEnv } from "@/lib/tracker/runtime";
import {
  checklistCreateSchema,
  checklistMutationSchema,
  checklistRemoveSchema,
  checklistRestoreSchema,
} from "@/lib/tracker/schemas";
import {
  createChecklistItem,
  getWorkspaceData,
  removeChecklistItem,
  restoreHiddenChecklistItem,
  updateChecklistItem,
} from "@/lib/tracker/service";
import type {
  TrackerChecklistCreateInput,
  TrackerChecklistMutationInput,
  TrackerChecklistRemoveInput,
  TrackerChecklistRestoreInput,
} from "@/lib/tracker/types";

async function buildChecklistResponse(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
  action: (
    env: Awaited<ReturnType<typeof getTrackerEnv>>,
    projectId: string,
    payload: unknown,
  ) => Promise<unknown>,
  schema: {
    parse: (value: unknown) => unknown;
  },
) {
  const env = await getTrackerEnv();
  const { projectId } = await context.params;
  const payload = schema.parse(await request.json());
  const result = await action(env, projectId, payload);
  const workspace = await getWorkspaceData(env);
  return createJsonResponse({ item: result, workspace });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    return await buildChecklistResponse(
      request,
      context,
      async (env, projectId, payload) =>
        createChecklistItem(env, projectId, payload as TrackerChecklistCreateInput),
      checklistCreateSchema,
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    return await buildChecklistResponse(
      request,
      context,
      async (env, projectId, payload) =>
        updateChecklistItem(env, projectId, payload as TrackerChecklistMutationInput),
      checklistMutationSchema,
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    return await buildChecklistResponse(
      request,
      context,
      async (env, projectId, payload) => {
        await removeChecklistItem(
          env,
          projectId,
          payload as TrackerChecklistRemoveInput,
        );
        return { removed: true };
      },
      checklistRemoveSchema,
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    return await buildChecklistResponse(
      request,
      context,
      async (env, projectId, payload) => {
        await restoreHiddenChecklistItem(
          env,
          projectId,
          payload as TrackerChecklistRestoreInput,
        );
        return { restored: true };
      },
      checklistRestoreSchema,
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
