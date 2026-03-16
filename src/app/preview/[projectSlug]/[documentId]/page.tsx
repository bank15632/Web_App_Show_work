import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LayoutTemplate, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

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
  getProjectBySlug,
  getProjectDocument,
  getProjects,
} from "@/lib/portal-data";
import { outlineLinkClass } from "@/lib/portal-styles";

type PreviewPageProps = {
  params: Promise<{ projectSlug: string; documentId: string }>;
};

export async function generateStaticParams() {
  return getProjects().flatMap((project) =>
    project.sections.flatMap((section) =>
      section.items.map((document) => ({
        projectSlug: project.slug,
        documentId: document.id,
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { projectSlug, documentId } = await params;
  const project = getProjectBySlug(projectSlug);
  const document = project ? getProjectDocument(project, documentId) : undefined;

  if (!project || !document) {
    return {
      title: "Preview Not Found",
    };
  }

  return {
    title: `${document.title} Preview`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { projectSlug, documentId } = await params;
  const project = getProjectBySlug(projectSlug);

  if (!project) {
    notFound();
  }

  const document = getProjectDocument(project, documentId);

  if (!document) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 lg:px-10">
      <Card className="w-full border-border/70 bg-card/90">
        <CardHeader className="gap-4 border-b border-border/70">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {document.kind === "canva" ? "Canva Embed Slot" : "PDF Viewer Slot"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {document.version}
            </Badge>
          </div>

          <div className="space-y-2">
            <CardTitle className="font-display text-4xl">
              {document.title}
            </CardTitle>
            <CardDescription>
              {project.title} · updated {formatPortalDate(document.updatedAt)}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[0.65fr_0.35fr]">
          <div className="rounded-[2rem] border border-dashed border-border bg-canvas p-8">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
              {document.kind === "canva" ? (
                <LayoutTemplate className="size-5 text-foreground" />
              ) : (
                <FileText className="size-5 text-foreground" />
              )}
            </div>

            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight">
              Replace this fallback with your real viewer
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              ตอนนี้ route นี้มีไว้เป็น preview fallback ภายในระบบ เพื่อให้ layout
              และ flow ของ project room ทำงานครบก่อนคุณจะใส่ลิงก์ Canva embed หรือ PDF จริง
            </p>

            <div className="mt-8 rounded-3xl bg-background/85 p-5">
              <p className="font-medium">Document summary</p>
              <p className="mt-2 text-sm leading-7 text-ink-soft">
                {document.summary}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  Wiring later
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p>1. ใส่ `viewerUrl` สำหรับ Canva embed หรือ PDF URL จริง</p>
                <p>2. ใส่ `downloadUrl` ถ้าต้องการปุ่มโหลด PDF</p>
                <p>3. Deploy แล้วค่อยป้องกัน path นี้ผ่าน Cloudflare Access</p>
              </CardContent>
            </Card>

            <Link href={`/p/${project.slug}`} className={outlineLinkClass}>
              กลับไป project room
            </Link>

            <div className="rounded-3xl bg-secondary p-4 text-sm leading-7 text-secondary-foreground">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="size-4" />
                Why this exists
              </div>
              <p className="mt-2">
                เพื่อให้ระบบ preview ไม่ว่างเปล่าระหว่างที่คุณยังไม่ได้ใส่ไฟล์จริง
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
