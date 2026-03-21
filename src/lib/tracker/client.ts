import type {
  TrackerTaskMutationInput,
  TrackerTaskRecord,
  TrackerWorkspaceData,
} from "@/lib/tracker/types";

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(data.error || "Tracker request failed.");
  }

  return data;
}

export async function fetchTrackerWorkspace() {
  const data = await requestJson<{ workspace: TrackerWorkspaceData }>(
    "/api/tracker/workspace",
    {
      cache: "no-store",
    },
  );
  return data.workspace;
}

export async function createTrackerTaskRequest(
  projectId: string,
  task: TrackerTaskMutationInput,
) {
  return requestJson<{ task: TrackerTaskRecord; workspace: TrackerWorkspaceData }>(
    "/api/tracker/tasks",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, task }),
    },
  );
}
