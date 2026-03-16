import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Eye, LockKeyhole, ScrollText } from "lucide-react";
import { notFound } from "next/navigation";

import { DocumentPreview } from "@/components/portal/document-preview";
import { ProjectStageBadge } from "@/components/portal/project-stage-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatPortalDate,
  getDocumentPreviewUrl,
  getLatestDocuments,
  getProjectBySlug,
  getProjects,
  hasUsableUrl,
} from "@/lib/portal-data";
import {
  ghostLinkClass,
  outlineLinkClass,
  primaryLinkClass,
  secondaryLinkClass,
} from "@/lib/portal-styles";

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

  const latestDocuments = getLatestDocuments(project);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-32 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full bg-accent/20 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4 lg:px-10">
          <div className="min-w-0 flex-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                CR
              </span>
              <div>
                <p className="font-display text-lg font-semibold">Client Rooms</p>
                <p className="text-sm text-muted-foreground">
                  Project room สำหรับ {project.clientName}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className={ghostLinkClass}>
              Overview
            </Link>
            <Link href="/studio" className={outlineLinkClass}>
              Owner dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="gap-4 border-b border-border/70">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  {project.code}
                </Badge>
                <ProjectStageBadge stage={project.stage} />
                <Badge variant="secondary" className="px-3 py-1">
                  {project.projectType}
                </Badge>
              </div>

              <div className="space-y-3">
                <CardTitle className="font-display text-4xl">
                  {project.title}
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">
                  {project.overview}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft">
                <span>Client: {project.clientName}</span>
                <span>Location: {project.location}</span>
                <span>Updated: {formatPortalDate(project.updatedAt)}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Latest milestone</p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {project.nextMilestone}
                  </p>
                </div>
                <div className="rounded-3xl bg-accent/15 p-4">
                  <p className="text-sm text-muted-foreground">Share mode</p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {project.shareMode}
                  </p>
                </div>
                <div className="rounded-3xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Cleanup after</p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatPortalDate(project.retentionUntil)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="#latest" className={primaryLinkClass}>
                  ดูเวอร์ชันล่าสุด
                  <ArrowRight className="size-4" />
                </a>
                <a href="#documents" className={secondaryLinkClass}>
                  เปิดรายการเอกสารทั้งหมด
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-foreground text-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LockKeyhole className="size-5 text-primary" />
                <div>
                  <CardDescription className="text-background/70">
                    Access note
                  </CardDescription>
                  <CardTitle className="font-display text-3xl">
                    ลิงก์นี้ควรถูกป้องกันหลัง deploy
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl bg-background/10 p-4 text-sm leading-7 text-background/80">
                โปรเจกต์นี้ออกแบบมาให้ลูกค้าเห็นเฉพาะเอกสารของงานตัวเอง ไม่เห็น project list ของงานอื่น
              </div>
              <div className="rounded-3xl bg-background/10 p-4 text-sm leading-7 text-background/80">
                หลัง deploy ให้ lock path นี้ด้วย Cloudflare Access ตามอีเมลลูกค้าของงานนี้
              </div>
              <div className="rounded-3xl bg-background/10 p-4 text-sm leading-7 text-background/80">
                ถ้าต้องการ export PDF ให้ใส่ `downloadUrl` ใน data file แล้วปุ่มโหลดจะขึ้นเอง
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="latest" className="space-y-4">
          <div className="space-y-2">
            <Badge variant="outline" className="px-3 py-1">
              Latest delivery
            </Badge>
            <h2 className="font-display text-3xl font-semibold">
              เวอร์ชันล่าสุดที่ควรให้ลูกค้าเปิดก่อน
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {latestDocuments.map((document) => (
              <Card key={document.id} className="border-border/70 bg-card/90">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                      {document.sectionTitle}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {document.version}
                    </Badge>
                  </div>
                  <CardTitle className="font-display text-2xl">
                    {document.title}
                  </CardTitle>
                  <CardDescription>
                    อัปเดต {formatPortalDate(document.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    {document.summary}
                  </p>
                  <a
                    href={getDocumentPreviewUrl(project, document)}
                    target="_blank"
                    rel="noreferrer"
                    className={secondaryLinkClass}
                  >
                    เปิดดูบนเว็บ
                    <Eye className="size-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="documents" className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr]">
          <Card className="h-fit border-border/70 bg-card/90 lg:sticky lg:top-24">
            <CardHeader>
              <CardDescription>Quick jumps</CardDescription>
              <CardTitle className="font-display text-2xl">
                Section navigator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`${outlineLinkClass} w-full justify-start`}
                >
                  {section.title}
                </a>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {project.sections.map((section) => (
              <Card
                key={section.id}
                id={section.id}
                className="border-border/70 bg-card/90"
              >
                <CardHeader className="gap-3 border-b border-border/70">
                  <CardDescription>{section.description}</CardDescription>
                  <CardTitle className="font-display text-3xl">
                    {section.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-5 pt-5">
                  {section.items.map((document) => {
                    const previewUrl = getDocumentPreviewUrl(project, document);
                    const hasDownload = hasUsableUrl(document.downloadUrl);

                    return (
                      <div
                        key={document.id}
                        className="grid gap-4 rounded-3xl border border-border/70 bg-background/70 p-4 lg:grid-cols-[0.42fr_0.58fr]"
                      >
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="px-3 py-1">
                              {document.kind === "canva" ? "Canva" : "PDF"}
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1">
                              {document.version}
                            </Badge>
                            {document.latest ? (
                              <Badge className="px-3 py-1">Latest</Badge>
                            ) : null}
                          </div>

                          <div>
                            <p className="font-display text-2xl font-semibold">
                              {document.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Updated {formatPortalDate(document.updatedAt)}
                            </p>
                          </div>

                          <p className="text-sm leading-7 text-muted-foreground">
                            {document.summary}
                          </p>

                          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={secondaryLinkClass}
                            >
                              <Eye className="size-4" />
                              ดูบนเว็บ
                            </a>

                            {hasDownload ? (
                              <a
                                href={document.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={outlineLinkClass}
                              >
                                <Download className="size-4" />
                                ดาวน์โหลด PDF
                              </a>
                            ) : (
                              <span className="inline-flex h-10 items-center rounded-full bg-secondary px-4 text-sm text-secondary-foreground">
                                PDF export pending
                              </span>
                            )}
                          </div>
                        </div>

                        <DocumentPreview
                          title={document.title}
                          summary={document.summary}
                          kind={document.kind}
                          previewUrl={previewUrl}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ScrollText className="size-5 text-primary" />
                <div>
                  <CardDescription>Implementation note</CardDescription>
                  <CardTitle className="font-display text-2xl">
                    ตอนนี้หน้า project room ใช้ fallback preview ภายในระบบ
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              เมื่อคุณมีลิงก์ Canva embed หรือ path ของ PDF จริง ให้แทนค่า `viewerUrl`
              และ `downloadUrl` ใน data model แล้วหน้านี้จะเปลี่ยนจาก mock preview
              ไปเป็นตัวดูไฟล์จริงทันทีโดยไม่ต้องรื้อ layout ใหม่
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
