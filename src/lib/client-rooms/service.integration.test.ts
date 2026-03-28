import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import {
  createClientRoomAsset,
  createClientRoomProject,
  getClientRoomAssetById,
  publishClientRoomProject,
  saveClientRoomProject,
  unpublishClientRoomProject,
} from "@/lib/client-rooms/service";
import type { ClientRoomProjectRecord } from "@/lib/client-rooms/types";

function extractAssetId(url: string) {
  const match = url.match(/\/api\/client-rooms\/assets\/([^/?#]+)/);
  return match?.[1] ?? "";
}

function setHeroImage(project: ClientRoomProjectRecord, heroImageUrl: string) {
  return {
    ...project.draftData,
    heroImageUrl,
  };
}

async function createHeroAsset(projectId: string, fileName: string) {
  return createClientRoomAsset(env, {
    projectId,
    kind: "hero",
    fileName,
    mimeType: "image/png",
    bytes: new TextEncoder().encode(fileName).buffer,
  });
}

async function expectAssetPresent(assetId: string, objectKey: string) {
  expect(await getClientRoomAssetById(env, assetId)).not.toBeNull();
  expect(await env.ARTIFACTS_BUCKET.get(objectKey)).not.toBeNull();
}

async function expectAssetDeleted(assetId: string, objectKey: string) {
  expect(await getClientRoomAssetById(env, assetId)).toBeNull();
  expect(await env.ARTIFACTS_BUCKET.get(objectKey)).toBeNull();
}

async function createTestProject(name: string) {
  return createClientRoomProject(env, {
    title: `${name} ${crypto.randomUUID().slice(0, 8)}`,
  });
}

describe("client room asset cleanup", () => {
  it("deletes replaced draft-only hero assets after save", async () => {
    const project = await createTestProject("Draft cleanup");
    const firstHero = await createHeroAsset(project.id, "draft-hero-1.png");

    const savedProject = await saveClientRoomProject(
      env,
      project.id,
      setHeroImage(project, firstHero.url),
    );

    const secondHero = await createHeroAsset(project.id, "draft-hero-2.png");
    const updatedProject = await saveClientRoomProject(
      env,
      project.id,
      setHeroImage(savedProject, secondHero.url),
    );

    expect(updatedProject.draftData.heroImageUrl).toBe(secondHero.url);
    expect(extractAssetId(updatedProject.draftData.heroImageUrl)).toBe(secondHero.asset.id);
    await expectAssetDeleted(firstHero.asset.id, firstHero.asset.objectKey);
    await expectAssetPresent(secondHero.asset.id, secondHero.asset.objectKey);
  });

  it("keeps published assets until a new publish replaces them", async () => {
    const project = await createTestProject("Published cleanup");
    const firstHero = await createHeroAsset(project.id, "published-hero-1.png");

    const savedProject = await saveClientRoomProject(
      env,
      project.id,
      setHeroImage(project, firstHero.url),
    );
    await publishClientRoomProject(env, project.id);

    const secondHero = await createHeroAsset(project.id, "published-hero-2.png");
    const updatedDraftProject = await saveClientRoomProject(
      env,
      project.id,
      setHeroImage(savedProject, secondHero.url),
    );

    expect(updatedDraftProject.draftData.heroImageUrl).toBe(secondHero.url);
    await expectAssetPresent(firstHero.asset.id, firstHero.asset.objectKey);

    const republishedProject = await publishClientRoomProject(env, project.id);

    expect(republishedProject.publishedData?.heroImageUrl).toBe(secondHero.url);
    expect(extractAssetId(republishedProject.publishedData?.heroImageUrl ?? "")).toBe(
      secondHero.asset.id,
    );
    await expectAssetDeleted(firstHero.asset.id, firstHero.asset.objectKey);
    await expectAssetPresent(secondHero.asset.id, secondHero.asset.objectKey);
  });

  it("deletes assets that become orphaned after unpublish", async () => {
    const project = await createTestProject("Unpublish cleanup");
    const firstHero = await createHeroAsset(project.id, "unpublish-hero-1.png");

    const savedProject = await saveClientRoomProject(
      env,
      project.id,
      setHeroImage(project, firstHero.url),
    );
    await publishClientRoomProject(env, project.id);

    const secondHero = await createHeroAsset(project.id, "unpublish-hero-2.png");
    const updatedDraftProject = await saveClientRoomProject(
      env,
      project.id,
      setHeroImage(savedProject, secondHero.url),
    );

    const unpublishedProject = await unpublishClientRoomProject(env, project.id);

    expect(updatedDraftProject.draftData.heroImageUrl).toBe(secondHero.url);
    expect(unpublishedProject.publishedData).toBeNull();
    expect(unpublishedProject.draftData.heroImageUrl).toBe(secondHero.url);
    await expectAssetDeleted(firstHero.asset.id, firstHero.asset.objectKey);
    await expectAssetPresent(secondHero.asset.id, secondHero.asset.objectKey);
  });
});
