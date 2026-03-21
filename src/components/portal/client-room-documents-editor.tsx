"use client";

import type { ReactNode } from "react";
import { FileUp, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createEmptyClientRoomDocument,
  type ClientRoomDocument,
  type ClientRoomDraftData,
  type ClientRoomSectionId,
} from "@/lib/client-rooms/types";

function textareaClassName() {
  return "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
}

function serializeRooms(rooms: ClientRoomDocument["rooms"]) {
  return rooms
    .map((room) =>
      room.description.trim() ? `${room.name} | ${room.description}` : room.name,
    )
    .join("\n");
}

function parseRooms(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, ...descriptionParts] = line.split("|");
      return {
        name: namePart?.trim() ?? "",
        description: descriptionParts.join("|").trim(),
      };
    })
    .filter((room) => room.name);
}

function buildDocumentTitle(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").trim() || fileName;
}

export function ClientRoomDocumentsEditor({
  draft,
  onChange,
  onUpload,
  uploadingTarget,
  onStatus,
}: {
  draft: ClientRoomDraftData;
  onChange: (updater: (draft: ClientRoomDraftData) => ClientRoomDraftData) => void;
  onUpload: (kind: "document", file: File) => Promise<string>;
  uploadingTarget: string;
  onStatus: (message: string) => void;
}) {
  function addDocuments(sectionId: ClientRoomSectionId, documents: ClientRoomDocument[]) {
    const hasNewLatest = documents.some((document) => document.latest);

    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...documents,
                ...(hasNewLatest
                  ? section.items.map((item) => ({
                      ...item,
                      latest: false,
                    }))
                  : section.items),
              ],
            }
          : section,
      ),
    }));
  }

  function updateDocument(
    sectionId: ClientRoomSectionId,
    documentId: string,
    updater: (document: ClientRoomDocument) => ClientRoomDocument,
  ) {
    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === documentId ? updater(item) : item,
              ),
            }
          : section,
      ),
    }));
  }

  function addDocument(sectionId: ClientRoomSectionId) {
    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                {
                  ...createEmptyClientRoomDocument(),
                  latest: section.items.length === 0,
                },
                ...section.items,
              ],
            }
          : section,
      ),
    }));
  }

  function removeDocument(sectionId: ClientRoomSectionId, documentId: string) {
    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== documentId),
            }
          : section,
      ),
    }));
  }

  async function handleSectionUpload(sectionId: ClientRoomSectionId, files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    if (nextFiles.length === 0) {
      return;
    }

    const section = draft.sections.find((item) => item.id === sectionId);
    const shouldMarkLatest = !section || section.items.length === 0;
    const documents: ClientRoomDocument[] = nextFiles.map((file, index) => ({
      ...createEmptyClientRoomDocument("pdf"),
      title: buildDocumentTitle(file.name),
      kind: "pdf",
      latest: shouldMarkLatest && index === 0,
    }));

    addDocuments(sectionId, documents);

    let successCount = 0;
    const failedFiles: string[] = [];

    for (const [index, file] of nextFiles.entries()) {
      const document = documents[index];

      try {
        onStatus(`กำลังอัปโหลดเอกสาร ${index + 1}/${nextFiles.length}: ${file.name}`);
        const url = await onUpload("document", file);
        updateDocument(sectionId, document.id, (current) => ({
          ...current,
          kind: file.type === "application/pdf" ? "pdf" : current.kind,
          viewerUrl: url,
          downloadUrl: url,
        }));
        successCount += 1;
      } catch (error) {
        failedFiles.push(file.name);
        onStatus(error instanceof Error ? error.message : `อัปโหลด ${file.name} ไม่สำเร็จ`);
      }
    }

    if (failedFiles.length > 0) {
      onStatus(
        `อัปโหลดเอกสารสำเร็จ ${successCount}/${nextFiles.length} ไฟล์ ไฟล์ที่ยังต้อง retry: ${failedFiles.join(", ")}`,
      );
      return;
    }

    onStatus(`อัปโหลดเอกสาร ${successCount} ไฟล์แล้ว`);
  }

  async function handleDocumentUpload(
    sectionId: ClientRoomSectionId,
    documentId: string,
    file: File | null,
  ) {
    if (!file) {
      return;
    }

    try {
      const url = await onUpload("document", file);
      updateDocument(sectionId, documentId, (document) => ({
        ...document,
        kind: file.type === "application/pdf" ? "pdf" : document.kind,
        viewerUrl: url,
        downloadUrl: url,
      }));
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "อัปโหลดไฟล์เอกสารไม่สำเร็จ");
    }
  }

  return (
    <>
      {draft.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                {uploadingTarget.startsWith("document:") ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <FileUp className="size-4" />
                )}
                อัปหลายไฟล์
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void handleSectionUpload(section.id, event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
              <Button variant="outline" onClick={() => addDocument(section.id)}>
                <Plus />
                เพิ่มเอกสาร
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีเอกสารในหมวดนี้</p>
            ) : null}

            {section.items.map((document) => (
              <div
                key={document.id}
                className="space-y-4 rounded-2xl border border-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">{document.id}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDocument(section.id, document.id)}
                  >
                    <Trash2 />
                    ลบ
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Title">
                    <Input
                      value={document.title}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Version">
                    <Input
                      value={document.version}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          version: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Updated At">
                    <Input
                      type="date"
                      value={document.updatedAt}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          updatedAt: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Kind">
                    <select
                      value={document.kind}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          kind: event.target.value as ClientRoomDocument["kind"],
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="pdf">PDF</option>
                      <option value="canva">Canva</option>
                    </select>
                  </Field>
                  <Field label="Viewer URL">
                    <Input
                      value={document.viewerUrl}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          viewerUrl: event.target.value,
                        }))
                      }
                      placeholder="ลิงก์ Canva / PDF / embed"
                    />
                  </Field>
                  <Field label="Download URL">
                    <Input
                      value={document.downloadUrl}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          downloadUrl: event.target.value,
                        }))
                      }
                      placeholder="ลิงก์ดาวน์โหลด PDF"
                    />
                  </Field>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Summary</label>
                    <textarea
                      value={document.summary}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          summary: event.target.value,
                        }))
                      }
                      className={textareaClassName()}
                      placeholder="คำอธิบายเอกสาร"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Rooms per line</label>
                    <textarea
                      value={serializeRooms(document.rooms)}
                      onChange={(event) =>
                        updateDocument(section.id, document.id, (current) => ({
                          ...current,
                          rooms: parseRooms(event.target.value),
                        }))
                      }
                      className={textareaClassName()}
                      placeholder="ห้องนั่งเล่น | ปรับโทนผนัง&#10;ห้องนอนใหญ่ | เพิ่ม warm lighting"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 md:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={document.latest}
                        onChange={(event) =>
                          updateDocument(section.id, document.id, (current) => ({
                            ...current,
                            latest: event.target.checked,
                          }))
                        }
                      />
                      Latest revision
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={document.checked}
                        onChange={(event) =>
                          updateDocument(section.id, document.id, (current) => ({
                            ...current,
                            checked: event.target.checked,
                          }))
                        }
                      />
                      Checked / approved
                    </label>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Upload document file</label>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                      {uploadingTarget.startsWith("document:") ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <FileUp className="size-4" />
                      )}
                      Upload PDF or file
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(event) =>
                          void handleDocumentUpload(
                            section.id,
                            document.id,
                            event.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
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
