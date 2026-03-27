"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FileUp, GripVertical, LoaderCircle, Plus, Trash2 } from "lucide-react";

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

function hasUsableUrl(value: string) {
  return value.trim().length > 0;
}

function isImageDocument(document: ClientRoomDocument) {
  return document.kind === "image" || document.mimeType.startsWith("image/");
}

function getImagePreviewUrl(document: ClientRoomDocument) {
  if (!isImageDocument(document)) {
    return "";
  }

  return document.viewerUrl || document.downloadUrl;
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function addDocuments(sectionId: ClientRoomSectionId, documents: ClientRoomDocument[]) {
    const hasNewLatest = documents.some((document) => document.latest);

    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...(hasNewLatest
                  ? section.items.map((item) => ({
                      ...item,
                      latest: false,
                    }))
                  : section.items),
                ...documents,
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
                ...section.items,
                {
                  ...createEmptyClientRoomDocument(),
                  latest: section.items.length === 0,
                },
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

  function moveDocument(sectionId: ClientRoomSectionId, oldIndex: number, newIndex: number) {
    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: arrayMove(section.items, oldIndex, newIndex) }
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
      kind: file.type.startsWith("image/") ? "image" : "pdf",
      mimeType: file.type,
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
          kind: file.type.startsWith("image/")
            ? "image"
            : file.type === "application/pdf"
              ? "pdf"
              : current.kind,
          mimeType: file.type,
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
        kind: file.type.startsWith("image/")
          ? "image"
          : file.type === "application/pdf"
            ? "pdf"
            : document.kind,
        mimeType: file.type,
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event: DragEndEvent) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                const oldIndex = section.items.findIndex((item) => item.id === active.id);
                const newIndex = section.items.findIndex((item) => item.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                  moveDocument(section.id, oldIndex, newIndex);
                }
              }}
            >
              <SortableContext
                items={section.items.map((doc) => doc.id)}
                strategy={verticalListSortingStrategy}
              >
                {section.items.map((document, index) => (
                  <SortableDocumentCard key={document.id} id={document.id}>
                    {(handleProps) => (
                      <CollapsibleDocumentCard
                        document={document}
                        index={index}
                        totalItems={section.items.length}
                        handleProps={handleProps}
                        onRemove={() => removeDocument(section.id, document.id)}
                        onMove={(newIndex) => moveDocument(section.id, index, newIndex)}
                        uploadingTarget={uploadingTarget}
                        onFieldChange={(updater) => updateDocument(section.id, document.id, updater)}
                        onFileUpload={(file) => handleDocumentUpload(section.id, document.id, file)}
                      />
                    )}
                  </SortableDocumentCard>
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function CollapsibleDocumentCard({
  document,
  index,
  totalItems,
  handleProps,
  onRemove,
  onMove,
  uploadingTarget,
  onFieldChange,
  onFileUpload,
}: {
  document: ClientRoomDocument;
  index: number;
  totalItems: number;
  handleProps: Record<string, unknown>;
  onRemove: () => void;
  onMove: (newIndex: number) => void;
  uploadingTarget: string;
  onFieldChange: (updater: (doc: ClientRoomDocument) => ClientRoomDocument) => void;
  onFileUpload: (file: File | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [orderInput, setOrderInput] = useState("");

  function handleOrderCommit(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(parsed - 1, totalItems - 1));
    if (clamped !== index) {
      onMove(clamped);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-3">
      {/* Collapsed row: grip + order + thumbnail + title + expand/collapse + delete */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical className="size-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={orderInput || String(index + 1)}
          onFocus={(e) => {
            setOrderInput(String(index + 1));
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => setOrderInput(e.target.value.replace(/\D/g, ""))}
          onBlur={(e) => {
            handleOrderCommit(e.target.value);
            setOrderInput("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleOrderCommit(orderInput);
              setOrderInput("");
              e.currentTarget.blur();
            }
          }}
          className="h-8 w-10 shrink-0 rounded-lg border border-input bg-transparent text-center text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          title="ลำดับที่ — แก้ตัวเลขเพื่อย้ายตำแหน่ง"
        />
        {hasUsableUrl(getImagePreviewUrl(document)) ? (
          <a
            href={getImagePreviewUrl(document)}
            target="_blank"
            rel="noreferrer"
            className="block w-20 shrink-0 overflow-hidden rounded-lg border border-border"
            title="เปิดรูปเต็ม"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImagePreviewUrl(document)}
              alt={document.title || document.id}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {document.title || document.id}
          </p>
          {document.version ? (
            <p className="truncate text-xs text-muted-foreground">{document.version}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          title={expanded ? "ย่อ" : "ขยายดูรายละเอียด"}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          <Trash2 />
          ลบ
        </Button>
      </div>

      {/* Expanded detail fields */}
      {expanded ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <Input
              value={document.title}
              onChange={(e) => onFieldChange((c) => ({ ...c, title: e.target.value }))}
            />
          </Field>
          <Field label="Version">
            <Input
              value={document.version}
              onChange={(e) => onFieldChange((c) => ({ ...c, version: e.target.value }))}
            />
          </Field>
          <Field label="Updated At">
            <Input
              type="date"
              value={document.updatedAt}
              onChange={(e) => onFieldChange((c) => ({ ...c, updatedAt: e.target.value }))}
            />
          </Field>
          <Field label="Kind">
            <select
              value={document.kind}
              onChange={(e) =>
                onFieldChange((c) => ({
                  ...c,
                  kind: e.target.value as ClientRoomDocument["kind"],
                }))
              }
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="canva">Canva</option>
            </select>
          </Field>
          <Field label="Viewer URL">
            <Input
              value={document.viewerUrl}
              onChange={(e) => onFieldChange((c) => ({ ...c, viewerUrl: e.target.value }))}
              placeholder="ลิงก์ Canva / PDF / embed"
            />
          </Field>
          <Field label="Download URL">
            <Input
              value={document.downloadUrl}
              onChange={(e) => onFieldChange((c) => ({ ...c, downloadUrl: e.target.value }))}
              placeholder="ลิงก์ดาวน์โหลด PDF"
            />
          </Field>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Summary</label>
            <textarea
              value={document.summary}
              onChange={(e) => onFieldChange((c) => ({ ...c, summary: e.target.value }))}
              className={textareaClassName()}
              placeholder="คำอธิบายเอกสาร"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Rooms per line</label>
            <textarea
              value={serializeRooms(document.rooms)}
              onChange={(e) => onFieldChange((c) => ({ ...c, rooms: parseRooms(e.target.value) }))}
              className={textareaClassName()}
              placeholder="ห้องนั่งเล่น | ปรับโทนผนัง&#10;ห้องนอนใหญ่ | เพิ่ม warm lighting"
            />
          </div>
          <div className="flex flex-wrap gap-4 md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={document.latest}
                onChange={(e) => onFieldChange((c) => ({ ...c, latest: e.target.checked }))}
              />
              Latest revision
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={document.checked}
                onChange={(e) => onFieldChange((c) => ({ ...c, checked: e.target.checked }))}
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
                onChange={(e) => onFileUpload(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortableDocumentCard({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children({ ...attributes, ...listeners })}
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
