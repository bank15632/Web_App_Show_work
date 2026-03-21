import type {
  GtdItem,
  GtdItemMutationInput,
  GtdReviewMutationInput,
  GtdWorkspaceData,
  WeeklyReviewState,
} from "@/lib/gtd-system";

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(data.error || "GTD request failed.");
  }

  return data;
}

export async function fetchGtdWorkspace() {
  const data = await requestJson<{ workspace: GtdWorkspaceData }>("/api/gtd/workspace", {
    cache: "no-store",
  });
  return data.workspace;
}

export async function createGtdItemRequest(item: GtdItemMutationInput) {
  return requestJson<{ item: GtdItem; workspace: GtdWorkspaceData }>("/api/gtd/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item }),
  });
}

export async function updateGtdItemRequest(
  itemId: string,
  item: Partial<GtdItemMutationInput>,
) {
  return requestJson<{ item: GtdItem; workspace: GtdWorkspaceData }>(
    `/api/gtd/items/${itemId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    },
  );
}

export async function deleteGtdItemRequest(itemId: string) {
  return requestJson<{ deleted: { id: string }; workspace: GtdWorkspaceData }>(
    `/api/gtd/items/${itemId}`,
    {
      method: "DELETE",
    },
  );
}

export async function updateGtdReviewRequest(review: GtdReviewMutationInput) {
  return requestJson<{ review: WeeklyReviewState; workspace: GtdWorkspaceData }>(
    "/api/gtd/review",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review }),
    },
  );
}
