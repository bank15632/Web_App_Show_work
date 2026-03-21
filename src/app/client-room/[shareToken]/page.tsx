import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectRoomView } from "@/components/portal/project-room-view";
import { getPublishedClientRoomByShareToken } from "@/lib/client-rooms/service";
import { toPortalProject } from "@/lib/client-rooms/view";
import { getTrackerEnv } from "@/lib/tracker/runtime";

type SharedClientRoomPageProps = {
  params: Promise<{ shareToken: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: SharedClientRoomPageProps): Promise<Metadata> {
  const env = await getTrackerEnv();
  const { shareToken } = await params;
  const project = await getPublishedClientRoomByShareToken(env, shareToken);

  if (!project?.publishedData) {
    return {
      title: "Client Room Not Found",
    };
  }

  return {
    title: project.publishedData.title,
    description: `${project.publishedData.title} client room for ${project.publishedData.clientName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharedClientRoomPage({
  params,
}: SharedClientRoomPageProps) {
  const env = await getTrackerEnv();
  const { shareToken } = await params;
  const project = await getPublishedClientRoomByShareToken(env, shareToken);

  if (!project?.publishedData) {
    notFound();
  }

  return <ProjectRoomView project={toPortalProject(project)} />;
}
