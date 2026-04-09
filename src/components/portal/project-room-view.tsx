import Image from "next/image";

import { ProjectDocumentBrowser } from "@/components/portal/project-document-browser";
import { ProjectGallery } from "@/components/portal/project-gallery";
import {
  ProjectPresentationLaunchButton,
  ProjectPresentationProvider,
} from "@/components/portal/project-presentation";
import type { ClientProject } from "@/lib/portal-data";

export function ProjectRoomView({ project }: { project: ClientProject }) {
  return (
    <ProjectPresentationProvider project={project}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 md:px-8 xl:px-12">
            <Image
              src="/logo-bnj.svg"
              alt="BNJ Studio"
              width={100}
              height={50}
              priority
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
            <ProjectPresentationLaunchButton className="ml-auto shrink-0">
              Slide Presentation
            </ProjectPresentationLaunchButton>
          </div>
        </header>

        <main>
          <section className="border-b border-border">
            <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10 xl:px-12 xl:pb-20">
              <h1 className="max-w-5xl font-display text-5xl leading-none tracking-[-0.04em] md:text-7xl xl:text-[5.75rem]">
                {project.title}
              </h1>

              <div className="mt-10 overflow-hidden rounded-2xl bg-secondary">
                {project.heroImageUrl ? (
                  <Image
                    src={project.heroImageUrl}
                    alt={project.title}
                    width={1600}
                    height={900}
                    sizes="(max-width: 768px) 100vw, 1280px"
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Hero image - รูปหลักของโปรเจกต์
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
                <div>
                  <h2 className="text-xl font-semibold">เกี่ยวกับโครงการ</h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                    {project.overview}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                  <ProjectMetaItem label="ลูกค้า" value={project.clientName} />
                  <ProjectMetaItem label="ที่ตั้ง" value={project.location} />
                  <ProjectMetaItem label="พื้นที่" value={project.area} />
                  <ProjectMetaItem label="ปี" value={project.year} />
                </div>
              </div>
            </div>
          </section>

          <ProjectDocumentBrowser project={project} />
          <ProjectGallery rooms={project.gallery} />
        </main>
      </div>
    </ProjectPresentationProvider>
  );
}

function ProjectMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <p className="text-[0.72rem] uppercase tracking-[0.26em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}
