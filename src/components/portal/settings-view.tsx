"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Clock3,
  Download,
  FileJson,
  FileSpreadsheet,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";

import {
  aecSettingsStorageKey,
  createDefaultAecSettings,
  safeParseAecSettings,
  type AecSettingsState,
} from "@/lib/aec-settings";
import { manualSettingsCards } from "@/lib/aec-user-manual";
import { fetchGtdWorkspace } from "@/lib/gtd/client";
import {
  contextOptions,
  getWeeklyReviewStatus,
} from "@/lib/gtd-system";
import type { ClientRoomProjectSummary } from "@/lib/client-rooms/types";
import type { TrackerWorkspaceData } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

const notificationFields: Array<{
  key: keyof AecSettingsState["notifications"];
  label: string;
  body: string;
}> = [
  {
    key: "weeklyReview",
    label: "Weekly review",
    body: "เตือนทุก 7 วัน และใช้เกณฑ์แดงเมื่อเกิน 10 วัน",
  },
  {
    key: "dueDates",
    label: "Due dates",
    body: "แจ้งเตือนงานที่ใกล้ครบกำหนดและ overdue",
  },
  {
    key: "boardChanges",
    label: "Board changes",
    body: "อัปเดตเมื่อ card มีการเปลี่ยนสถานะหรือ assignment",
  },
  {
    key: "aiSummary",
    label: "AI summary",
    body: "สรุป focus รายสัปดาห์และ next action ที่ควรหยิบก่อน",
  },
];

export function SettingsView() {
  const [settings, setSettings] = useState<AecSettingsState>(createDefaultAecSettings);
  const [statusMessage, setStatusMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [reviewStatusLabel, setReviewStatusLabel] = useState("ยังไม่เคยทำ Weekly Review");
  const [isReady, setIsReady] = useState(false);
  const csvTimeoutIdsRef = useRef<number[]>([]);

  useEffect(() => {
    let ignore = false;
    const storedSettings = window.localStorage.getItem(aecSettingsStorageKey);

    setSettings(safeParseAecSettings(storedSettings));
    setIsReady(true);

    async function loadReviewStatus() {
      try {
        const workspace = await fetchGtdWorkspace();
        if (!ignore) {
          setReviewStatusLabel(
            getWeeklyReviewStatus(workspace.review.lastCompletedAt).title,
          );
        }
      } catch {
        if (!ignore) setReviewStatusLabel("ยังไม่สามารถอ่านสถานะ Weekly Review ได้");
      }
    }

    void loadReviewStatus();

    const handleWindowFocus = () => {
      void loadReviewStatus();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      ignore = true;
      window.removeEventListener("focus", handleWindowFocus);
      csvTimeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      csvTimeoutIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(aecSettingsStorageKey, JSON.stringify(settings));
  }, [isReady, settings]);

  async function handleExportJson() {
    setIsExporting(true);

    try {
      const payload = await collectExportPayload(settings);
      downloadFile(
        "aec-workspace-export.json",
        JSON.stringify(payload, null, 2),
        "application/json;charset=utf-8",
      );
      setStatusMessage("Downloaded JSON export.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "JSON export failed.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportCsv() {
    setIsExporting(true);

    try {
      const payload = await collectExportPayload(settings);
      const files: Array<{ name: string; contents: string }> = [
        {
          name: "aec-gtd-items.csv",
          contents: toCsv(
            payload.gtd.items.map((item) => ({
              id: item.id,
              text: item.text,
              bucket: item.bucket,
              context: item.context,
              priority: item.priority,
              dueDate: item.dueDate ?? "",
              done: item.done,
              doneAt: item.doneAt ?? "",
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              note: item.note,
            })),
          ),
        },
        {
          name: "aec-client-projects.csv",
          contents: toCsv(
            payload.clientProjects.map((project) => ({
              slug: project.slug,
              title: project.title,
              clientName: project.clientName,
              projectType: project.projectType,
              location: project.location,
              year: project.year,
              shareToken: project.shareToken ?? "",
              updatedAt: project.updatedAt,
              publishedAt: project.publishedAt ?? "",
              documentCount: project.documentCount,
            })),
          ),
        },
      ];

      if (payload.tracker) {
        files.push(
          {
            name: "aec-tracker-projects.csv",
            contents: toCsv(
              payload.tracker.projects.map((project) => ({
                id: project.id,
                slug: project.slug,
                code: project.code,
                name: project.name,
                clientName: project.clientName,
                phase: project.phase,
                status: project.status,
                location: project.location,
                updatedAt: project.updatedAt,
              })),
            ),
          },
          {
            name: "aec-tracker-tasks.csv",
            contents: toCsv(
              payload.tracker.projects.flatMap((project) =>
                project.tasks.map((task) => ({
                  id: task.id,
                  projectId: task.projectId,
                  projectName: project.name,
                  title: task.title,
                  status: task.status,
                  priority: task.priority,
                  assignee: task.assignee,
                  dueDate: task.dueDate ?? "",
                  taskType: task.taskType,
                  nextAction: task.nextAction,
                  blocker: task.blocker,
                })),
              ),
            ),
          },
          {
            name: "aec-tracker-artifacts.csv",
            contents: toCsv(
              payload.tracker.projects.flatMap((project) =>
                project.artifacts.map((artifact) => ({
                  id: artifact.id,
                  projectId: artifact.projectId,
                  projectName: project.name,
                  kind: artifact.kind,
                  title: artifact.title,
                  revision: artifact.revision,
                  updatedAt: artifact.updatedAt,
                })),
              ),
            ),
          },
          {
            name: "aec-tracker-review-items.csv",
            contents: toCsv(
              payload.tracker.reviewItems.map((item) => ({
                id: item.id,
                projectId: item.projectId,
                action: item.action,
                status: item.status,
                confidence: item.confidence,
                reviewedAt: item.reviewedAt ?? "",
                rejectionReason: item.rejectionReason ?? "",
              })),
            ),
          },
        );
      }

      csvTimeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      csvTimeoutIdsRef.current = files.map((file, index) =>
        window.setTimeout(() => {
          downloadFile(file.name, file.contents, "text/csv;charset=utf-8");
        }, index * 120),
      );

      setStatusMessage(`Downloaded ${files.length} CSV file(s).`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "CSV export failed.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ed_100%)]">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-[10px]">
        <div className="flex flex-wrap items-center gap-3 px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <Link
            href="/aec-workflow"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Settings2 className="size-4" />
            User manual
          </Link>
          <Link
            href="/gtd"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <UserRound className="size-4" />
            GTD workspace
          </Link>
          <Link
            href="/todos"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Users className="size-4" />
            Kanban board
          </Link>
        </div>
      </header>

      <main className="space-y-8 px-6 py-10 lg:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_24rem]">
          <div className="rounded-[2rem] border border-border bg-background p-8 shadow-[0_24px_80px_rgba(0,0,0,0.04)]">
            <p className="caption-editorial">Settings + Team</p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-pretty sm:text-4xl lg:text-5xl">
              ตั้งค่า profile, notifications และ export
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              หน้า settings นี้ยึดตามคู่มือผู้ใช้: profile ใช้กับ daily flow,
              notifications แยกตามประเภท และ export รองรับทั้ง CSV กับ JSON
            </p>
          </div>

          <div className="rounded-[2rem] border border-border bg-background p-6">
            <p className="caption-editorial">Review Status</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              {reviewStatusLabel}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              ระบบใช้สถานะนี้เป็นฐานสำหรับ dashboard และ notification logic ของ weekly review
            </p>
          </div>
        </section>

        {statusMessage ? (
          <div className="rounded-[1.5rem] border border-border bg-background px-5 py-3 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-border bg-background p-6">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" />
              <p className="caption-editorial">Profile</p>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Display name</span>
                <input
                  value={settings.displayName}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      displayName: event.target.value,
                    }))
                  }
                  className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Avatar label</span>
                <input
                  value={settings.avatarLabel}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      avatarLabel: event.target.value.slice(0, 3).toUpperCase(),
                    }))
                  }
                  className="h-11 rounded-full border border-border px-4 text-sm uppercase outline-none transition-colors focus:border-foreground"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Default context</span>
                <select
                  value={settings.defaultContext}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultContext: event.target.value as AecSettingsState["defaultContext"],
                    }))
                  }
                  className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
                >
                  {contextOptions
                    .filter((item) => item.value !== "all")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Working hours start</span>
                  <input
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        workingHoursStart: event.target.value,
                      }))
                    }
                    className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Working hours end</span>
                  <input
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        workingHoursEnd: event.target.value,
                      }))
                    }
                    className="h-11 rounded-full border border-border px-4 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-background p-6">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 text-muted-foreground" />
              <p className="caption-editorial">Notifications</p>
            </div>

            <div className="mt-6 space-y-3">
              {notificationFields.map((field) => {
                const enabled = settings.notifications[field.key];

                return (
                  <label
                    key={field.key}
                    className="flex items-start gap-4 rounded-[1.25rem] border border-border/80 bg-secondary/30 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [field.key]: event.target.checked,
                          },
                        }))
                      }
                      className="mt-1 size-4 rounded border-border"
                    />
                    <div>
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {field.body}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-[2rem] border border-border bg-background p-6">
            <div className="flex items-center gap-2">
              <Download className="size-4 text-muted-foreground" />
              <p className="caption-editorial">Export</p>
            </div>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
              ดาวน์โหลดข้อมูลจากระบบ
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              CSV เหมาะกับ spreadsheet และจะดาวน์โหลดหลายไฟล์แยกตาม table ส่วน JSON
              เหมาะกับการส่งต่อให้ developer หรือ archive snapshot ของ workspace
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleExportCsv();
                }}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileSpreadsheet className="size-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleExportJson();
                }}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileJson className="size-4" />
                Export JSON
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-background p-6">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <p className="caption-editorial">Team Management</p>
            </div>

            <div className="mt-6 space-y-3">
              <RoleCard
                role="Owner"
                body="จัดการทุกอย่าง รวมถึง role และการลบสมาชิก"
              />
              <RoleCard
                role="Admin"
                body="จัดการ board และ workflow ร่วมกับทีม"
              />
              <RoleCard
                role="Member"
                body="ดูข้อมูลและย้าย cards ตามสิทธิ์ที่ได้รับ"
              />
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-dashed border-border px-4 py-4 text-sm leading-7 text-muted-foreground">
              Invite และ remove member ยังเป็น planned capability ใน workspace ชุดนี้
              แต่ role model และการจัดวาง settings ถูกเตรียมตามคู่มือไว้แล้ว
            </div>
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {manualSettingsCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.5rem] border border-border bg-background p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="caption-editorial text-[0.68rem]">{card.title}</p>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    card.status === "available" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                    card.status === "partial" &&
                      "border-amber-200 bg-amber-50 text-amber-700",
                    card.status === "planned" &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {card.body}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-border bg-background p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-muted-foreground" />
            <p className="caption-editorial">Persistence</p>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            การตั้งค่า profile และ notification ถูกเก็บไว้ใน browser ปัจจุบัน
            ส่วน GTD และ tracker ที่ export จะดึงจากฐานข้อมูลปัจจุบันของ workspace
          </p>
        </section>
      </main>
    </div>
  );
}

function RoleCard({ role, body }: { role: string; body: string }) {
  return (
    <article className="rounded-[1.25rem] border border-border/80 bg-secondary/30 p-4">
      <h3 className="text-sm font-semibold">{role}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}

async function collectExportPayload(settings: AecSettingsState) {
  const gtdWorkspace = await fetchGtdWorkspace();
  const tracker = await getTrackerWorkspace().catch(() => null);
  const clientProjects = await getClientRoomProjects().catch(() => []);

  return {
    exportedAt: new Date().toISOString(),
    settings,
    gtd: gtdWorkspace,
    tracker,
    clientProjects,
  };
}

async function getTrackerWorkspace(): Promise<TrackerWorkspaceData> {
  const response = await fetch("/api/tracker/workspace", { cache: "no-store" });
  const data = (await response.json()) as { error?: string; workspace?: TrackerWorkspaceData };

  if (!response.ok || !data.workspace) {
    throw new Error(data.error || "Kanban board unavailable.");
  }

  return data.workspace;
}

async function getClientRoomProjects(): Promise<ClientRoomProjectSummary[]> {
  const response = await fetch("/api/client-rooms/projects", { cache: "no-store" });
  const data = (await response.json()) as {
    error?: string;
    projects?: ClientRoomProjectSummary[];
  };

  if (!response.ok || !data.projects) {
    throw new Error(data.error || "Client rooms unavailable.");
  }

  return data.projects;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "message\r\nNo data\r\n";

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(","),
    ),
  ];

  return `${lines.join("\r\n")}\r\n`;
}

function escapeCsv(value: unknown) {
  const stringValue = String(value ?? "");
  const escapedValue = stringValue.replace(/"/g, '""');
  return `"${escapedValue}"`;
}

function downloadFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
