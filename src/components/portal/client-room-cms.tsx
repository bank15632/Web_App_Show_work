"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  EyeOff,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Plus,
  Rocket,
  Save,
  Trash2,
} from "lucide-react";

import { ClientRoomDocumentsEditor } from "@/components/portal/client-room-documents-editor";
import { ClientRoomGalleryEditor } from "@/components/portal/client-room-gallery-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadClientRoomAssetMultipart } from "@/lib/client-rooms/upload";
import {
  buildClientRoomSharePath,
  getClientRoomThumbnailUrl,
  type ClientRoomDraftData,
  type ClientRoomProjectRecord,
  type ClientRoomProjectSummary,
} from "@/lib/client-rooms/types";

type UploadKind = "hero" | "gallery" | "document";

function textareaClassName() {
  return "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
}

function buildAbsoluteUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function mapProjectSummary(project: ClientRoomProjectRecord): ClientRoomProjectSummary {
  return {
    id: project.id,
    title: project.title,
    clientName: project.clientName,
    slug: project.slug,
    projectType: project.draftData.projectType,
    location: project.draftData.location,
    year: project.draftData.year,
    overview: project.draftData.overview,
    thumbnailUrl: getClientRoomThumbnailUrl(project.draftData),
    documentCount: project.draftData.sections.reduce(
      (count, section) => count + section.items.length,
      0,
    ),
    shareToken: project.shareToken,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    publishedAt: project.publishedAt,
  };
}

export function ClientRoomCms({ initialProjectId = "" }: { initialProjectId?: string }) {
  const [projects, setProjects] = useState<ClientRoomProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [project, setProject] = useState<ClientRoomProjectRecord | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("Untitled Client Room");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{
    label: string;
    progress: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState("กำลังโหลด client rooms...");
  const isUploading = uploadingTarget.length > 0;

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const projectId = initialProjectId;
    if (!projectId || projectId === selectedProjectId) {
      return;
    }

    setSelectedProjectId(projectId);
    void loadProject(projectId);
  }, [initialProjectId, selectedProjectId]);

  async function loadProjects(nextProjectId?: string) {
    setIsLoadingProjects(true);

    try {
      const response = await fetch("/api/client-rooms/projects", { cache: "no-store" });
      const data = (await response.json()) as {
        error?: string;
        projects?: ClientRoomProjectSummary[];
      };

      if (!response.ok || !data.projects) {
        throw new Error(data.error || "โหลดรายการ client rooms ไม่สำเร็จ");
      }

      setProjects(data.projects);
      const targetId = nextProjectId ?? selectedProjectId ?? data.projects[0]?.id ?? "";

      if (targetId) {
        setSelectedProjectId(targetId);
        await loadProject(targetId);
      } else {
        setProject(null);
        setSelectedProjectId("");
        setStatusMessage("ยังไม่มี client room เริ่มจากสร้างโปรเจกต์แรก");
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "โหลดรายการ client rooms ไม่สำเร็จ",
      );
    } finally {
      setIsLoadingProjects(false);
    }
  }

  async function loadProject(projectId: string) {
    setIsLoadingProject(true);
    setStatusMessage("กำลังโหลดข้อมูลโปรเจกต์...");

    try {
      const response = await fetch(`/api/client-rooms/projects/${projectId}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        error?: string;
        project?: ClientRoomProjectRecord;
      };

      if (!response.ok || !data.project) {
        throw new Error(data.error || "โหลดโปรเจกต์ไม่สำเร็จ");
      }

      setProject(data.project);
      setStatusMessage("พร้อมแก้ไข draft และ publish ลิงก์ลูกค้า");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "โหลดโปรเจกต์ไม่สำเร็จ");
    } finally {
      setIsLoadingProject(false);
    }
  }

  async function createProject() {
    setStatusMessage("กำลังสร้าง client room ใหม่...");

    try {
      const response = await fetch("/api/client-rooms/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ title: newProjectTitle }),
      });
      const data = (await response.json()) as {
        error?: string;
        project?: ClientRoomProjectRecord;
      };

      if (!response.ok || !data.project) {
        throw new Error(data.error || "สร้าง client room ไม่สำเร็จ");
      }

      setNewProjectTitle("Untitled Client Room");
      await loadProjects(data.project.id);
      setStatusMessage("สร้าง client room ใหม่แล้ว");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "สร้าง client room ไม่สำเร็จ");
    }
  }

  function updateDraft(updater: (draft: ClientRoomDraftData) => ClientRoomDraftData) {
    setProject((current) =>
      current
        ? {
            ...current,
            draftData: updater(current.draftData),
          }
        : current,
    );
  }

  function setDraftField<Key extends keyof ClientRoomDraftData>(
    key: Key,
    value: ClientRoomDraftData[Key],
  ) {
    updateDraft((draft) => ({
      ...draft,
      [key]: value,
    }));
  }

  async function saveCurrentProjectDraft() {
    if (!project) {
      return null;
    }

    setIsSaving(true);
    setStatusMessage("กำลังบันทึก draft...");

    try {
      const response = await fetch(`/api/client-rooms/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          draftData: project.draftData,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        project?: ClientRoomProjectRecord;
      };

      if (!response.ok || !data.project) {
        throw new Error(data.error || "บันทึก draft ไม่สำเร็จ");
      }

      setProject(data.project);
      setProjects((current) =>
        current.map((item) =>
          item.id === data.project?.id ? mapProjectSummary(data.project) : item,
        ),
      );
      setStatusMessage("บันทึก draft แล้ว");
      return data.project;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "บันทึก draft ไม่สำเร็จ");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function publishProject() {
    if (!project) {
      return;
    }

    setIsPublishing(true);
    setStatusMessage("กำลัง publish snapshot สำหรับลูกค้า...");

    try {
      const savedProject = await saveCurrentProjectDraft();
      const projectId = savedProject?.id ?? project.id;
      const response = await fetch(`/api/client-rooms/projects/${projectId}/publish`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        project?: ClientRoomProjectRecord;
      };

      if (!response.ok || !data.project) {
        throw new Error(data.error || "publish ไม่สำเร็จ");
      }

      setProject(data.project);
      setProjects((current) =>
        current.map((item) =>
          item.id === data.project?.id ? mapProjectSummary(data.project) : item,
        ),
      );
      setStatusMessage("publish สำเร็จ ลิงก์ลูกค้าถูก freeze ตาม snapshot ล่าสุดแล้ว");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "publish ไม่สำเร็จ");
    } finally {
      setIsPublishing(false);
    }
  }

  async function unpublishProject() {
    if (!project?.publishedAt) {
      return;
    }

    const confirmed = window.confirm(
      `Unpublish "${project.title}"? ลิงก์ลูกค้าจะเปิดไม่ได้จนกว่าจะ publish ใหม่อีกครั้ง`,
    );
    if (!confirmed) {
      return;
    }

    setIsUnpublishing(true);
    setStatusMessage("กำลังยกเลิกการเผยแพร่ลิงก์ลูกค้า...");

    try {
      const response = await fetch(`/api/client-rooms/projects/${project.id}/publish`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        error?: string;
        project?: ClientRoomProjectRecord;
      };

      if (!response.ok || !data.project) {
        throw new Error(data.error || "unpublish ไม่สำเร็จ");
      }

      setProject(data.project);
      setProjects((current) =>
        current.map((item) =>
          item.id === data.project?.id ? mapProjectSummary(data.project) : item,
        ),
      );
      setStatusMessage("ยกเลิกการเผยแพร่แล้ว ลิงก์ลูกค้าถูกปิดชั่วคราว");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "unpublish ไม่สำเร็จ");
    } finally {
      setIsUnpublishing(false);
    }
  }

  async function deleteCurrentProject() {
    if (!project) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${project.title}" and all uploaded files for this client room? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(`กำลังลบ "${project.title}"...`);

    try {
      const deletingProjectId = project.id;
      const response = await fetch(`/api/client-rooms/projects/${deletingProjectId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        error?: string;
        deleted?: boolean;
        projects?: ClientRoomProjectSummary[];
      };

      if (!response.ok || !data.deleted || !data.projects) {
        throw new Error(data.error || "ลบ project ไม่สำเร็จ");
      }

      const nextProjectId = data.projects[0]?.id ?? "";
      setProjects(data.projects);
      setProject(null);
      setSelectedProjectId(nextProjectId);

      if (nextProjectId) {
        await loadProject(nextProjectId);
        setStatusMessage("ลบ project แล้ว และเปิด project ถัดไปให้แล้ว");
      } else {
        setStatusMessage("ลบ project แล้ว ตอนนี้ยังไม่มี client room ในระบบ");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "ลบ project ไม่สำเร็จ");
    } finally {
      setIsDeleting(false);
    }
  }

  async function uploadAsset(kind: UploadKind, file: File) {
    if (!project) {
      throw new Error("ยังไม่ได้เลือก client room");
    }

    setUploadingTarget(`${kind}:${file.name}`);
    setUploadProgress({
      label: file.name,
      progress: 0,
    });
    setStatusMessage(`กำลังอัปโหลด ${file.name}...`);

    try {
      const url = await uploadClientRoomAssetMultipart({
        projectId: project.id,
        kind,
        file,
        onProgress: (progress) => {
          setUploadProgress({
            label: file.name,
            progress,
          });
          setStatusMessage(`กำลังอัปโหลด ${file.name}... ${progress}%`);
        },
      });

      setStatusMessage(`อัปโหลด ${file.name} แล้ว`);
      return url;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : `อัปโหลด ${file.name} ไม่สำเร็จ`);
      throw error;
    } finally {
      setUploadingTarget("");
      setUploadProgress(null);
    }
  }

  async function handleHeroUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const url = await uploadAsset("hero", file);
      setDraftField("heroImageUrl", url);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "อัปโหลด hero image ไม่สำเร็จ");
    }
  }

  async function copyShareLink() {
    if (!project?.shareToken) {
      return;
    }

    const absoluteUrl = buildAbsoluteUrl(buildClientRoomSharePath(project.shareToken));
    if (!absoluteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setStatusMessage("คัดลอกลิงก์ลูกค้าแล้ว");
    } catch {
      setStatusMessage("ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอกด้วยตนเอง");
    }
  }

  const sharePath = project?.shareToken
    && project.publishedAt
    ? buildClientRoomSharePath(project.shareToken)
    : null;
  const shareUrl = buildAbsoluteUrl(sharePath);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-4 md:px-8">
          <Image
            src="/logo-bnj.svg"
            alt="BNJ Studio"
            width={120}
            height={60}
            priority
            className="h-8 w-auto shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
              Client Room CMS
            </p>
            <p className="truncate font-display text-2xl leading-none">
              Draft, Publish, Share
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <Button
              variant="outline"
              onClick={() => void saveCurrentProjectDraft()}
              disabled={!project || isSaving || isPublishing || isUnpublishing || isDeleting || isUploading}
            >
              {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
              Save Draft
            </Button>
            <Button
              onClick={() => void publishProject()}
              disabled={!project || isSaving || isPublishing || isUnpublishing || isDeleting || isUploading}
            >
              {isPublishing ? <LoaderCircle className="animate-spin" /> : <Rocket />}
              Publish
            </Button>
            <Button
              variant="outline"
              onClick={() => void unpublishProject()}
              disabled={!project?.publishedAt || isSaving || isPublishing || isUnpublishing || isDeleting || isUploading}
            >
              {isUnpublishing ? <LoaderCircle className="animate-spin" /> : <EyeOff />}
              Unpublish
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteCurrentProject()}
              disabled={!project || isSaving || isPublishing || isUnpublishing || isDeleting || isUploading}
            >
              {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
              Delete Project
            </Button>
          </div>
        </div>
      </header>

      <main className="grid gap-6 px-5 py-6 md:px-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สร้าง Client Room</CardTitle>
              <CardDescription>
                แก้ draft ในหน้านี้ แล้วค่อย publish เป็นลิงก์ลูกค้าแบบอ่านอย่างเดียว
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={newProjectTitle}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                placeholder="ชื่อโปรเจกต์"
                disabled={isUploading || isUnpublishing}
              />
              <Button className="w-full" onClick={() => void createProject()} disabled={isUploading || isUnpublishing}>
                <Plus />
                สร้างโปรเจกต์ใหม่
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingProjects ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  กำลังโหลดรายการ...
                </div>
              ) : null}

              {!isLoadingProjects && projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มี client room</p>
              ) : null}

              {projects.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedProjectId(item.id);
                    void loadProject(item.id);
                  }}
                  disabled={isUploading || isUnpublishing}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedProjectId === item.id
                      ? "border-foreground bg-secondary/60"
                      : "border-border hover:border-foreground/40 hover:bg-secondary/30"
                  }`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.clientName || "ยังไม่ระบุชื่อลูกค้า"}
                  </p>
                  <p className="mt-2 text-[0.72rem] text-muted-foreground">
                    slug: {item.slug}
                  </p>
                  <p className="text-[0.72rem] text-muted-foreground">
                    {item.publishedAt ? "Published แล้ว" : "ยังไม่ publish"}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-7 text-muted-foreground">{statusMessage}</p>
              {uploadProgress ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{uploadProgress.label}</span>
                    <span>{uploadProgress.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-foreground transition-[width]"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6">
          {!project ? (
            <Card>
              <CardHeader>
                <CardTitle>ยังไม่ได้เลือกโปรเจกต์</CardTitle>
                <CardDescription>
                  สร้างหรือเลือก client room จากคอลัมน์ซ้ายก่อน
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {project ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Share Link</CardTitle>
                  <CardDescription>
                    ลิงก์นี้อ่านจาก published snapshot เท่านั้น ลูกค้าแก้ข้อมูลไม่ได้จากหน้านี้
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Input value={shareUrl ?? "ยังไม่ publish"} readOnly />
                    <Button
                      variant="outline"
                      onClick={() => void copyShareLink()}
                      disabled={!shareUrl}
                    >
                      <Copy />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (sharePath) {
                          window.open(sharePath, "_blank", "noopener,noreferrer");
                        }
                      }}
                      disabled={!sharePath}
                    >
                      <ExternalLink />
                      เปิดหน้าลูกค้า
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ถ้าคุณแก้ draft เพิ่มเติม ลิงก์ลูกค้าจะยังคงเป็นข้อมูลเดิมจนกว่าจะกด
                    Publish อีกครั้ง
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลหลัก</CardTitle>
                  <CardDescription>
                    ส่วนนี้ใช้ใน hero และข้อมูลพื้นฐานด้านบนของหน้า client room
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Field label="ชื่อโปรเจกต์">
                    <Input
                      value={project.draftData.title}
                      onChange={(event) => setDraftField("title", event.target.value)}
                    />
                  </Field>
                  <Field label="Slug">
                    <Input
                      value={project.draftData.slug}
                      onChange={(event) => setDraftField("slug", event.target.value)}
                    />
                  </Field>
                  <Field label="ชื่อลูกค้า">
                    <Input
                      value={project.draftData.clientName}
                      onChange={(event) => setDraftField("clientName", event.target.value)}
                    />
                  </Field>
                  <Field label="ประเภทโปรเจกต์">
                    <select
                      value={project.draftData.projectType}
                      onChange={(event) =>
                        setDraftField(
                          "projectType",
                          event.target.value as ClientRoomDraftData["projectType"],
                        )
                      }
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="House">House</option>
                      <option value="Condo">Condo</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </Field>
                  <Field label="ที่ตั้ง">
                    <Input
                      value={project.draftData.location}
                      onChange={(event) => setDraftField("location", event.target.value)}
                    />
                  </Field>
                  <Field label="พื้นที่">
                    <Input
                      value={project.draftData.area}
                      onChange={(event) => setDraftField("area", event.target.value)}
                    />
                  </Field>
                  <Field label="ปี">
                    <Input
                      value={project.draftData.year}
                      onChange={(event) => setDraftField("year", event.target.value)}
                    />
                  </Field>
                  <Field label="Hero image URL">
                    <Input
                      value={project.draftData.heroImageUrl}
                      onChange={(event) => setDraftField("heroImageUrl", event.target.value)}
                      placeholder="/api/client-rooms/assets/..."
                    />
                  </Field>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">ภาพหลักของโปรเจกต์</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                        {uploadingTarget.startsWith("hero:") ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <ImagePlus className="size-4" />
                        )}
                        Upload Hero Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            void handleHeroUpload(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                    </div>
                    {project.draftData.heroImageUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-border bg-secondary/30">
                        <Image
                          src={project.draftData.heroImageUrl}
                          alt={project.draftData.title}
                          width={1600}
                          height={900}
                          unoptimized
                          className="aspect-[16/9] w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Overview</label>
                    <textarea
                      value={project.draftData.overview}
                      onChange={(event) => setDraftField("overview", event.target.value)}
                      className={textareaClassName()}
                      placeholder="คำอธิบายภาพรวมของโครงการ"
                    />
                  </div>
                </CardContent>
              </Card>

              <ClientRoomDocumentsEditor
                draft={project.draftData}
                onChange={updateDraft}
                onUpload={uploadAsset}
                uploadingTarget={uploadingTarget}
                onStatus={setStatusMessage}
              />

              <ClientRoomGalleryEditor
                draft={project.draftData}
                onChange={updateDraft}
                onUpload={uploadAsset}
                uploadingTarget={uploadingTarget}
                onStatus={setStatusMessage}
              />
            </>
          ) : null}

          {isLoadingProject ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6">
                <LoaderCircle className="size-4 animate-spin" />
                <span className="text-sm text-muted-foreground">กำลังโหลดโปรเจกต์...</span>
              </CardContent>
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
