import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban, LockKeyhole, Trash2 } from "lucide-react";

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
  getProjectDocumentCount,
  getProjects,
} from "@/lib/portal-data";
import {
  ghostLinkClass,
  outlineLinkClass,
  primaryLinkClass,
  secondaryLinkClass,
} from "@/lib/portal-styles";

export const metadata: Metadata = {
  title: "Owner Dashboard",
};

export default function StudioPage() {
  const projects = getProjects();
  const totalDocuments = projects.reduce(
    (count, project) => count + getProjectDocumentCount(project),
    0,
  );
  const activeProjects = projects.filter((project) => project.stage !== "archived");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-40 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-20 size-72 rounded-full bg-accent/20 blur-3xl" />

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
                  Owner-only dashboard สำหรับเลือกเปิดโปรเจกต์ลูกค้า
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className={ghostLinkClass}>
              กลับหน้าแรก
            </Link>
            <Link href={`/p/${projects[0]?.slug}`} className={outlineLinkClass}>
              เปิด sample room
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                Owner dashboard
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Noindex + Cloudflare Access ready
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                เลือกโปรเจกต์ลูกค้า แล้วส่งได้เฉพาะห้องที่เกี่ยวข้องกับงานนั้น
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                หน้านี้คือ index ส่วนตัวของคุณสำหรับเปิด project room, ตรวจสถานะงาน,
                ดูวัน cleanup และควบคุมเส้นทางแชร์ลิงก์โดยไม่ปะปนกับเว็บ portfolio หลัก
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/70 bg-card/90">
                <CardHeader className="gap-2">
                  <CardDescription>Active rooms</CardDescription>
                  <CardTitle className="font-display text-3xl">
                    {activeProjects.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  โปรเจกต์ที่ยังอยู่ใน concept, revision หรือ construction
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/90">
                <CardHeader className="gap-2">
                  <CardDescription>Documents tracked</CardDescription>
                  <CardTitle className="font-display text-3xl">
                    {totalDocuments}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  รวม Canva, PDF, revision archive และ construction sets
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/90">
                <CardHeader className="gap-2">
                  <CardDescription>Retention policy</CardDescription>
                  <CardTitle className="font-display text-3xl">3 ปี</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  เมื่อครบกำหนดสามารถล้างไฟล์ทิ้งได้ตาม workflow ที่คุณวางไว้
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/70 bg-foreground text-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LockKeyhole className="size-5 text-primary" />
                <div>
                  <CardDescription className="text-background/70">
                    Deployment notes
                  </CardDescription>
                  <CardTitle className="font-display text-3xl">
                    Rules ที่ควรเปิดหลัง deploy
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl bg-background/10 p-4 text-sm leading-7 text-background/80">
                Protect `/studio/*` ให้เข้าได้เฉพาะอีเมลของคุณ
              </div>
              <div className="rounded-3xl bg-background/10 p-4 text-sm leading-7 text-background/80">
                Protect `/p/[slug]/*` ให้เข้าได้เฉพาะอีเมลลูกค้าของโปรเจกต์นั้น
              </div>
              <div className="rounded-3xl bg-background/10 p-4 text-sm leading-7 text-background/80">
                ถ้า drawing set เกิน 25MB ค่อยย้าย PDF ไป R2 โดยยังใช้ project route เดิม
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="gap-3 border-b border-border/70">
              <CardDescription>Project index</CardDescription>
              <CardTitle className="font-display text-3xl">
                เลือกเปิด project room
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5">
              {projects.map((project) => (
                <div
                  key={project.slug}
                  className="rounded-3xl border border-border/70 bg-background/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                          {project.code}
                        </Badge>
                        <ProjectStageBadge stage={project.stage} />
                      </div>
                      <div>
                        <p className="font-display text-2xl font-semibold">
                          {project.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.clientName} · {project.projectType} · {project.location}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <p>อัปเดตล่าสุด</p>
                      <p className="font-medium text-foreground">
                        {formatPortalDate(project.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {project.overview}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                    <span>{getProjectDocumentCount(project)} files</span>
                    <span>{project.viewerCount} viewers</span>
                    <span>{project.shareMode}</span>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href={`/p/${project.slug}`} className={secondaryLinkClass}>
                      เปิด project room
                      <ArrowRight className="size-4" />
                    </Link>
                    <span className="inline-flex h-10 items-center rounded-full bg-secondary px-4 text-sm text-secondary-foreground">
                      Next: {project.nextMilestone}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FolderKanban className="size-5 text-primary" />
                  <div>
                    <CardDescription>Owner notes</CardDescription>
                    <CardTitle className="font-display text-2xl">
                      สิ่งที่ควรเช็กก่อนส่งลูกค้า
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.map((project) => (
                  <div key={project.slug} className="rounded-3xl bg-secondary/70 p-4">
                    <p className="font-medium">{project.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {project.ownerNote}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trash2 className="size-5 text-primary" />
                  <div>
                    <CardDescription>Cleanup queue</CardDescription>
                    <CardTitle className="font-display text-2xl">
                      ตรวจวันเก็บไฟล์
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {projects.map((project) => (
                  <div key={project.slug} className="rounded-3xl bg-secondary/70 p-4">
                    <p className="font-medium">{project.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ล้างไฟล์ได้หลัง {formatPortalDate(project.retentionUntil)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Link href="/" className={primaryLinkClass}>
            กลับหน้า overview ของระบบ
          </Link>
        </section>
      </main>
    </div>
  );
}
