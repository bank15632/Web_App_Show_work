import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectRoomView } from "@/components/portal/project-room-view";
import {
  getProjectBySlug,
  getProjects,
} from "@/lib/portal-data";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: `${project.title} client room for ${project.clientName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProjectRoomPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectRoomView project={project} />;
}
