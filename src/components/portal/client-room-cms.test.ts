import { describe, expect, it } from "vitest";

import { resolveClientRoomSelection } from "@/components/portal/client-room-cms";

describe("resolveClientRoomSelection", () => {
  const projects = [
    { id: "project-a" },
    { id: "project-b" },
    { id: "project-c" },
  ];

  it("prefers the requested project when it exists in the list", () => {
    expect(resolveClientRoomSelection(projects, "project-b", "project-a")).toBe("project-b");
  });

  it("keeps the current project when the requested one is missing", () => {
    expect(resolveClientRoomSelection(projects, "project-x", "project-c")).toBe("project-c");
  });

  it("falls back to the first project when ids are empty or unavailable", () => {
    expect(resolveClientRoomSelection(projects, "", "")).toBe("project-a");
    expect(resolveClientRoomSelection(projects, undefined, undefined)).toBe("project-a");
  });

  it("returns an empty string when the project list is empty", () => {
    expect(resolveClientRoomSelection([], "project-a", "project-b")).toBe("");
  });
});
