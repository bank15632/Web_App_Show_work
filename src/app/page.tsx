import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  LockKeyhole,
  PanelRightDashed,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
  outlineLinkClass,
  primaryLinkClass,
  secondaryLinkClass,
} from "@/lib/portal-styles";

export const metadata: Metadata = {
  title: "Client Portal",
};

const architecture = [
  {
    icon: FolderKanban,
    title: "Portfolio แยกจาก client portal",
    description:
      "เว็บ portfolio ของคุณอยู่แยกเหมือนเดิม ส่วนระบบนี้ไว้ใช้ส่งลิงก์เฉพาะงานลูกค้าเท่านั้น.",
  },
  {
    icon: PanelRightDashed,
    title: "Owner dashboard ส่วนตัว",
    description:
      "คุณมีหน้า index สำหรับดูทุกโปรเจกต์ เลือกเปิด project room และจัดการสถานะงานจากจุดเดียว.",
  },
  {
    icon: ShieldCheck,
    title: "Project room รายลูกค้า",
    description:
      "แต่ละโปรเจกต์มีหน้าแยกของตัวเองสำหรับ Mood & Tone, Design, Revision, Drawing และ Timeline.",
  },
];

const deployment = [
  "Deploy บน Cloudflare Pages",
  "ล็อก /studio/* และ /p/* ด้วย Cloudflare Access",
  "ใช้ Pages ก่อน และค่อยเพิ่ม R2 ถ้า PDF เกิน 25MB",
];

export default function HomePage() {
  const projects = getProjects();
  const featuredProject = projects[0];
  const totalDocuments = projects.reduce(
    (count, project) => count + getProjectDocumentCount(project),
    0,
  );

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 -left-36 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            CR
          </span>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              Client Rooms
            </p>
            <p className="text-sm text-muted-foreground">
              Portal สำหรับส่งงาน Interior ให้ลูกค้าดูในลิงก์เดียว
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <a
            href="#architecture"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Architecture
          </a>
          <a
            href="#projects"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Projects
          </a>
          <Link href="/studio" className={outlineLinkClass}>
            เปิด owner dashboard
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <section className="grid gap-10 pb-14 pt-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                Interior design client portal
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Cloudflare-ready
              </Badge>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-none tracking-tight text-balance sm:text-6xl">
                ส่ง Mood &amp; Tone, Design, Revise และ Drawing ในลิงก์เดียว
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                โครงนี้ถูกปรับให้ตรงกับวิธีทำงานของคุณ: เว็บ portfolio แยกออกไป,
                คุณมี owner dashboard ของตัวเอง และลูกค้าแต่ละรายเห็นได้เฉพาะหน้าโปรเจกต์ของตัวเอง
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className={primaryLinkClass}>
                เข้า owner dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={`/p/${featuredProject.slug}`}
                className={secondaryLinkClass}
              >
                เปิดตัวอย่างหน้า client room
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/70 bg-card/90 backdrop-blur">
                <CardHeader className="gap-2">
                  <CardTitle className="font-display text-3xl font-semibold">
                    10 งาน/ปี
                  </CardTitle>
                  <CardDescription className="text-foreground">
                    สเกลที่คุณเล็งไว้
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  รองรับ project room แยกรายลูกค้าและ cleanup ทุก 3 ปีได้ตรง use case นี้
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/90 backdrop-blur">
                <CardHeader className="gap-2">
                  <CardTitle className="font-display text-3xl font-semibold">
                    3 ปี
                  </CardTitle>
                  <CardDescription className="text-foreground">
                    retention window
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  ช่วยให้คุณล้างไฟล์เก่าได้ตามรอบงานโดยไม่รก storage ระยะยาว
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/90 backdrop-blur">
                <CardHeader className="gap-2">
                  <CardTitle className="font-display text-3xl font-semibold">
                    {totalDocuments}
                  </CardTitle>
                  <CardDescription className="text-foreground">
                    sample documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  โครงข้อมูลพร้อมสำหรับ embed Canva, preview PDF และปุ่มดาวน์โหลด
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/70 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur">
            <CardHeader className="gap-4 border-b border-border/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardDescription>Best fit for your use case</CardDescription>
                  <CardTitle className="mt-1 font-display text-2xl">
                    Cloudflare Pages + Access
                  </CardTitle>
                </div>
                <Badge className="px-3 py-1">
                  <Sparkles className="size-3" />
                  Recommended
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Why this stack</p>
                  <p className="mt-2 font-display text-3xl font-semibold">Private-by-path</p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    แยกสิทธิ์ `/studio/*` และ `/p/[slug]/*` ได้ตรงกับวิธีส่งงานลูกค้าแบบรายโปรเจกต์
                  </p>
                </div>
                <div className="rounded-3xl bg-accent/15 p-4">
                  <p className="text-sm text-muted-foreground">Upgrade only when needed</p>
                  <p className="mt-2 font-display text-3xl font-semibold">R2 later</p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    เริ่มจาก Pages ก่อน แล้วค่อยเพิ่ม R2 เฉพาะไฟล์ PDF ใหญ่หรือกรณีไม่อยาก redeploy
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {deployment.map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LockKeyhole className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">{item}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Step {index + 1} สำหรับ deploy ระบบนี้ให้ใกล้ของจริงที่สุดโดยไม่ต้องรีบจ่าย
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section
          id="architecture"
          className="grid gap-6 border-t border-border/70 py-14 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <Badge variant="outline" className="px-3 py-1">
              Architecture
            </Badge>
            <h2 className="font-display text-4xl font-semibold tracking-tight">
              โครงที่เหมาะกับงาน Interior review จริง
            </h2>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              จุดสำคัญไม่ใช่แค่ทำเว็บสวย แต่ต้องจัดไฟล์หลายเวอร์ชันให้ลูกค้าเข้าใจง่าย,
              ดูในเว็บได้ และย้อน revision ได้โดยไม่หลุดไปเห็นโปรเจกต์คนอื่น
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {architecture.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border/70 bg-card/80 backdrop-blur">
                <CardHeader className="gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="font-display text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="projects" className="grid gap-6 border-t border-border/70 py-14">
          <div className="space-y-4">
            <Badge variant="outline" className="px-3 py-1">
              Sample Rooms
            </Badge>
            <h2 className="font-display text-4xl font-semibold tracking-tight">
              ตัวอย่าง project room ที่พร้อมต่อยอด
            </h2>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              ทุกโปรเจกต์ใช้ template เดียวกัน แต่คอนเทนต์และสถานะต่างกันได้ตาม lifecycle
              ของงานจริง ตั้งแต่ concept จนถึง construction
            </p>
          </div>

          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.slug} className="border-border/70 bg-card/90">
                <CardHeader className="gap-4 border-b border-border/70">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                          {project.code}
                        </Badge>
                        <ProjectStageBadge stage={project.stage} />
                      </div>
                      <CardTitle className="font-display text-2xl">
                        {project.title}
                      </CardTitle>
                      <CardDescription>
                        {project.clientName} · {project.projectType} · {project.location}
                      </CardDescription>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <p>อัปเดตล่าสุด</p>
                      <p className="font-medium text-foreground">
                        {formatPortalDate(project.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="space-y-2">
                    <p className="text-sm leading-7 text-muted-foreground">
                      {project.overview}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                      <span>{getProjectDocumentCount(project)} files</span>
                      <span>{project.viewerCount} viewers</span>
                      <span>{project.shareMode}</span>
                    </div>
                  </div>

                  <Link
                    href={`/p/${project.slug}`}
                    className={`${secondaryLinkClass} whitespace-nowrap`}
                  >
                    เปิดห้องงานนี้
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
