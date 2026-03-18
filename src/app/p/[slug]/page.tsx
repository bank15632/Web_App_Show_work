import type { Metadata } from "next";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";

import { ProjectDocumentBrowser } from "@/components/portal/project-document-browser";
import { ProjectGallery } from "@/components/portal/project-gallery";
import { ProjectTimeline } from "@/components/portal/project-timeline";
import { DocumentPreview } from "@/components/portal/document-preview";
import { Badge } from "@/components/ui/badge";
import {
  formatPortalDate,
  getDocumentPreviewUrl,
  getLatestDocuments,
  getProjectBySlug,
  getProjectDocumentCount,
  getProjects,
  getStageLabel,
} from "@/lib/portal-data";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

const actionLinkClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-foreground bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90";

const secondaryActionLinkClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary";

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

  const latestDocuments = getLatestDocuments(project);
  const heroDocument =
    latestDocuments[0] ?? project.sections.flatMap((section) => section.items)[0];
  const stageLabel = getStageLabel(project.stage);
  const documentCount = getProjectDocumentCount(project);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 md:px-8 xl:px-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={100}
            height={50}
            className="h-8 w-auto shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
              Client Room
            </p>
            <p className="truncate font-display text-2xl leading-none">
              {project.title}
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10 xl:px-12 xl:pb-20">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="h-7 rounded-full px-3">
                {project.code}
              </Badge>
              <Badge variant="outline" className="h-7 rounded-full px-3">
                {stageLabel}
              </Badge>
              <Badge variant="outline" className="h-7 rounded-full px-3">
                {project.projectType}
              </Badge>
            </div>

            <div className="mt-8 space-y-5">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-muted-foreground">
                Private client room
              </p>
              <h1 className="max-w-5xl font-display text-5xl leading-none tracking-[-0.04em] md:text-7xl xl:text-[5.75rem]">
                {project.title}
              </h1>
            </div>

            {heroDocument ? (
              <div className="mt-10 overflow-hidden rounded-[2rem] border border-border bg-card">
                <DocumentPreview
                  title={heroDocument.title}
                  summary={heroDocument.summary}
                  kind={heroDocument.kind}
                  previewUrl={getDocumentPreviewUrl(project, heroDocument)}
                  className="min-h-[22rem] rounded-none border-0 bg-secondary/55 md:min-h-[32rem]"
                />
              </div>
            ) : null}

            <div className="mt-10 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="space-y-6">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.26em] text-muted-foreground">
                    About the delivery
                  </p>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                    {project.overview}
                  </p>
                </div>

                <div className="rounded-[2rem] border border-border bg-secondary/55 p-6">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="size-5 text-foreground" />
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.26em] text-muted-foreground">
                        Access note
                      </p>
                      <p className="mt-1 font-display text-3xl leading-none">
                        Client-only by project
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    ลิงก์นี้ควรถูกผูกกับ Cloudflare Access หลัง deploy เพื่อให้ลูกค้าเห็นเฉพาะไฟล์ของงานนี้
                    และไม่เห็นโปรเจกต์อื่น
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a href="#document-browser" className={actionLinkClass}>
                    เปิดเมนูเอกสาร
                    <ArrowRight className="size-4" />
                  </a>
                  <a href="#document-browser" className={secondaryActionLinkClass}>
                    เลือกหมวดและ revision
                  </a>
                </div>
              </div>

              <div className="grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border sm:grid-cols-2">
                <ProjectMetaItem label="Client" value={project.clientName} />
                <ProjectMetaItem label="Location" value={project.location} />
                <ProjectMetaItem
                  label="Updated"
                  value={formatPortalDate(project.updatedAt)}
                />
                <ProjectMetaItem label="Share mode" value={project.shareMode} />
                <ProjectMetaItem
                  label="Cleanup after"
                  value={formatPortalDate(project.retentionUntil)}
                />
                <ProjectMetaItem
                  label="Documents"
                  value={`${documentCount} files across ${project.sections.length} sections`}
                />
                <div className="bg-card p-6 sm:col-span-2">
                  <p className="text-[0.72rem] uppercase tracking-[0.26em] text-muted-foreground">
                    Current milestone
                  </p>
                  <p className="mt-3 font-display text-3xl leading-tight">
                    {project.nextMilestone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProjectDocumentBrowser project={project} />

        <ProjectTimeline events={project.timeline} />

        <ProjectGallery images={project.gallery} />
      </main>
    </div>
  );
}

function ProjectMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-6">
      <p className="text-[0.72rem] uppercase tracking-[0.26em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-foreground">{value}</p>
    </div>
  );
}
