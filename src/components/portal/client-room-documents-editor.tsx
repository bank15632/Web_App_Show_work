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
import { ChevronDown, ChevronRight, FileUp, GripVertical, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  filterDocumentsByRevision,
  getDefaultRevisionLabel,
  getNextRevisionLabel,
  getRevisionSummaries,
  moveRevisionGroup,
  setLatestRevision,
} from "@/lib/client-rooms/revisions";
import {
  createClientRoomId,
  createEmptyClientRoomDocument,
  type ClientRoomCategory,
  type ClientRoomDocument,
  type ClientRoomDraftData,
  type ClientRoomSection,
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

function getCategoryName(section: ClientRoomSection, categoryId: string) {
  return section.categories.find((c) => c.id === categoryId)?.name ?? "";
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
  const [selectedRevisionBySectionId, setSelectedRevisionBySectionId] = useState<
    Record<string, string>
  >({});

  function updateSection(
    sectionId: ClientRoomSectionId,
    updater: (section: ClientRoomSection) => ClientRoomSection,
  ) {
    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    }));
  }

  function addCategory(sectionId: ClientRoomSectionId, name: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      categories: [
        ...section.categories,
        { id: createClientRoomId("cat"), name },
      ],
    }));
  }

  function renameCategory(sectionId: ClientRoomSectionId, categoryId: string, name: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      categories: section.categories.map((c) =>
        c.id === categoryId ? { ...c, name } : c,
      ),
    }));
  }

  function removeCategory(sectionId: ClientRoomSectionId, categoryId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      categories: section.categories.filter((c) => c.id !== categoryId),
      items: section.items.map((item) =>
        item.categoryId === categoryId ? { ...item, categoryId: "" } : item,
      ),
    }));
  }

  function moveCategory(sectionId: ClientRoomSectionId, oldIndex: number, newIndex: number) {
    updateSection(sectionId, (section) => ({
      ...section,
      categories: arrayMove(section.categories, oldIndex, newIndex),
    }));
  }

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
        section.id !== sectionId
          ? section
          : (() => {
              const nextItems = section.items.map((item) =>
                item.id === documentId ? updater(item) : item,
              );
              const updatedDocument = nextItems.find((item) => item.id === documentId);

              return {
                ...section,
                items:
                  updatedDocument?.latest
                    ? nextItems.map((item) =>
                        item.id === documentId ? item : { ...item, latest: false },
                      )
                    : nextItems,
              };
            })(),
      ),
    }));
  }

  function addDocument(sectionId: ClientRoomSectionId, version?: string) {
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
                  version:
                    version ||
                    getDefaultRevisionLabel(section.items) ||
                    getNextRevisionLabel(section.items),
                  latest: section.items.length === 0,
                },
              ],
            }
          : section,
      ),
    }));
  }

  function addRevision(sectionId: ClientRoomSectionId) {
    const section = draft.sections.find((item) => item.id === sectionId);
    const nextRevisionLabel = getNextRevisionLabel(section?.items ?? []);

    setSelectedRevisionBySectionId((current) => ({
      ...current,
      [sectionId]: nextRevisionLabel,
    }));

    addDocuments(sectionId, [
      {
        ...createEmptyClientRoomDocument(),
        version: nextRevisionLabel,
        latest: true,
      },
    ]);
    onStatus(`สร้าง ${nextRevisionLabel} แล้ว`);
  }

  function setLatestRevisionForSection(
    sectionId: ClientRoomSectionId,
    revisionLabel: string,
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      items: setLatestRevision(section.items, revisionLabel),
    }));
    onStatus(`ตั้ง ${revisionLabel} เป็น Latest แล้ว`);
  }

  function moveRevisionForSection(
    sectionId: ClientRoomSectionId,
    revisionLabel: string,
    direction: -1 | 1,
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      items: moveRevisionGroup(section.items, revisionLabel, direction),
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

  function moveVisibleDocuments(
    sectionId: ClientRoomSectionId,
    visibleDocuments: ClientRoomDocument[],
    oldIndex: number,
    newIndex: number,
  ) {
    onChange((currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const visibleIds = visibleDocuments.map((document) => document.id);
        const reorderedVisibleIds = arrayMove(visibleIds, oldIndex, newIndex);
        const reorderedVisibleItems = reorderedVisibleIds
          .map((documentId) => section.items.find((item) => item.id === documentId))
          .filter((item): item is ClientRoomDocument => Boolean(item));

        let reorderedIndex = 0;

        return {
          ...section,
          items: section.items.map((item) => {
            if (!visibleIds.includes(item.id)) {
              return item;
            }

            const nextItem = reorderedVisibleItems[reorderedIndex];
            reorderedIndex += 1;
            return nextItem ?? item;
          }),
        };
      }),
    }));
  }

  async function handleSectionUpload(sectionId: ClientRoomSectionId, files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    if (nextFiles.length === 0) {
      return;
    }

    const section = draft.sections.find((item) => item.id === sectionId);
    const activeRevisionLabel = getActiveRevisionLabel(sectionId, section?.items ?? []);
    const shouldMarkLatest = !section || section.items.length === 0;
    const documents: ClientRoomDocument[] = nextFiles.map((file, index) => ({
      ...createEmptyClientRoomDocument("pdf"),
      title: buildDocumentTitle(file.name),
      version: activeRevisionLabel,
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

  function getActiveRevisionLabel(
    sectionId: ClientRoomSectionId,
    documents: ClientRoomDocument[],
  ) {
    const selectedRevisionLabel = selectedRevisionBySectionId[sectionId];
    const revisionSummaries = getRevisionSummaries(documents);

    if (revisionSummaries.some((summary) => summary.label === selectedRevisionLabel)) {
      return selectedRevisionLabel;
    }

    return getDefaultRevisionLabel(documents) || getNextRevisionLabel(documents);
  }

  return (
    <>
      {draft.sections.map((section) => (
        <DocumentSectionEditor
          key={section.id}
          section={section}
          sensors={sensors}
          uploadingTarget={uploadingTarget}
          activeRevisionLabel={getActiveRevisionLabel(section.id, section.items)}
          onAddCategory={(name) => addCategory(section.id, name)}
          onRenameCategory={(catId, name) => renameCategory(section.id, catId, name)}
          onRemoveCategory={(catId) => removeCategory(section.id, catId)}
          onMoveCategory={(oldIndex, newIndex) => moveCategory(section.id, oldIndex, newIndex)}
          onSelectRevision={(label) =>
            setSelectedRevisionBySectionId((current) => ({
              ...current,
              [section.id]: label,
            }))
          }
          onSetLatestRevision={(label) => setLatestRevisionForSection(section.id, label)}
          onMoveRevision={(label, direction) =>
            moveRevisionForSection(section.id, label, direction)
          }
          onAddRevision={() => addRevision(section.id)}
          onUploadFiles={(files) => void handleSectionUpload(section.id, files)}
          onAddDocument={() =>
            addDocument(section.id, getActiveRevisionLabel(section.id, section.items))
          }
          onMoveDocuments={(visibleDocuments, oldIndex, newIndex) =>
            moveVisibleDocuments(section.id, visibleDocuments, oldIndex, newIndex)
          }
          onRemoveDocument={(documentId) => removeDocument(section.id, documentId)}
          onUpdateDocument={(documentId, updater) =>
            updateDocument(section.id, documentId, updater)
          }
          onUploadDocument={(documentId, file) =>
            void handleDocumentUpload(section.id, documentId, file)
          }
        />
      ))}
    </>
  );
}

function DocumentSectionEditor({
  section,
  sensors,
  uploadingTarget,
  activeRevisionLabel,
  onAddCategory,
  onRenameCategory,
  onRemoveCategory,
  onMoveCategory,
  onSelectRevision,
  onSetLatestRevision,
  onMoveRevision,
  onAddRevision,
  onUploadFiles,
  onAddDocument,
  onMoveDocuments,
  onRemoveDocument,
  onUpdateDocument,
  onUploadDocument,
}: {
  section: ClientRoomSection;
  sensors: ReturnType<typeof useSensors>;
  uploadingTarget: string;
  activeRevisionLabel: string;
  onAddCategory: (name: string) => void;
  onRenameCategory: (categoryId: string, name: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onMoveCategory: (oldIndex: number, newIndex: number) => void;
  onSelectRevision: (label: string) => void;
  onSetLatestRevision: (label: string) => void;
  onMoveRevision: (label: string, direction: -1 | 1) => void;
  onAddRevision: () => void;
  onUploadFiles: (files: FileList | null) => void;
  onAddDocument: () => void;
  onMoveDocuments: (
    visibleDocuments: ClientRoomDocument[],
    oldIndex: number,
    newIndex: number,
  ) => void;
  onRemoveDocument: (documentId: string) => void;
  onUpdateDocument: (
    documentId: string,
    updater: (document: ClientRoomDocument) => ClientRoomDocument,
  ) => void;
  onUploadDocument: (documentId: string, file: File | null) => void;
}) {
  const revisionSummaries = getRevisionSummaries(section.items);
  const latestRevisionLabel = getDefaultRevisionLabel(section.items);
  const visibleDocuments = filterDocumentsByRevision(
    section.items,
    section.items,
    activeRevisionLabel,
  );

  return (
    <Card>
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
                onUploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <Button variant="outline" onClick={onAddRevision}>
            <Plus />
            เพิ่ม Revise ใหม่
          </Button>
          <Button variant="outline" onClick={onAddDocument}>
            <Plus />
            เพิ่มเอกสาร
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CategoryManager
          categories={section.categories}
          sensors={sensors}
          onAdd={onAddCategory}
          onRename={onRenameCategory}
          onRemove={onRemoveCategory}
          onMove={onMoveCategory}
        />

        <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {revisionSummaries.length > 0 ? (
              revisionSummaries.map((summary) => (
                <div
                  key={summary.label}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    summary.label === activeRevisionLabel
                      ? "border-foreground bg-background font-medium text-foreground"
                      : "border-border bg-background/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectRevision(summary.label)}
                      className="text-left"
                    >
                      <span>{summary.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {summary.count} ไฟล์
                      </span>
                    </button>
                    <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type="radio"
                        name={`${section.id}-latest-revision`}
                        checked={summary.isLatest}
                        onChange={() => onSetLatestRevision(summary.label)}
                      />
                      Latest
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onMoveRevision(summary.label, -1)}
                        disabled={summary.index === 0}
                        className="inline-flex size-6 items-center justify-center rounded border border-border text-xs disabled:opacity-40"
                        aria-label={`Move ${summary.label} earlier`}
                      >
                        {"<"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveRevision(summary.label, 1)}
                        disabled={summary.index === revisionSummaries.length - 1}
                        className="inline-flex size-6 items-center justify-center rounded border border-border text-xs disabled:opacity-40"
                        aria-label={`Move ${summary.label} later`}
                      >
                        {">"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">ยังไม่มีเอกสารในหมวดนี้</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeRevisionLabel
              ? `กำลังแก้ไข ${activeRevisionLabel}${latestRevisionLabel === activeRevisionLabel ? " (Latest)" : ""}`
              : `พร้อมเริ่ม ${getNextRevisionLabel(section.items)}`}
          </p>
        </div>

        {visibleDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีเอกสารใน {activeRevisionLabel || getNextRevisionLabel(section.items)}
          </p>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = visibleDocuments.findIndex((item) => item.id === active.id);
            const newIndex = visibleDocuments.findIndex((item) => item.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              onMoveDocuments(visibleDocuments, oldIndex, newIndex);
            }
          }}
        >
          <SortableContext
            items={visibleDocuments.map((doc) => doc.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleDocuments.map((document, index) => (
              <SortableDocumentCard key={document.id} id={document.id}>
                {(handleProps) => (
                  <CollapsibleDocumentCard
                    document={document}
                    index={index}
                    totalItems={visibleDocuments.length}
                    section={section}
                    handleProps={handleProps}
                    onRemove={() => onRemoveDocument(document.id)}
                    onMove={(newIndex) => onMoveDocuments(visibleDocuments, index, newIndex)}
                    uploadingTarget={uploadingTarget}
                    onFieldChange={(updater) => onUpdateDocument(document.id, updater)}
                    onFileUpload={(file) => onUploadDocument(document.id, file)}
                  />
                )}
              </SortableDocumentCard>
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

/* ---------- Category Manager ---------- */

function CategoryManager({
  categories,
  sensors,
  onAdd,
  onRename,
  onRemove,
  onMove,
}: {
  categories: ClientRoomCategory[];
  sensors: ReturnType<typeof useSensors>;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onMove: (oldIndex: number, newIndex: number) => void;
}) {
  const [newName, setNewName] = useState("");

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName("");
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border bg-secondary/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">หมวดหมู่ (Categories)</p>

      {categories.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = categories.findIndex((c) => c.id === active.id);
            const newIndex = categories.findIndex((c) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              onMove(oldIndex, newIndex);
            }
          }}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <SortableCategoryChip
                  key={category.id}
                  category={category}
                  onRename={(name) => onRename(category.id, name)}
                  onRemove={() => onRemove(category.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="ชื่อหมวดหมู่ใหม่ เช่น Living room"
          className="h-8 max-w-xs text-sm"
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!newName.trim()}>
          <Plus className="size-3" />
          เพิ่ม
        </Button>
      </div>
    </div>
  );
}

function SortableCategoryChip({
  category,
  onRename,
  onRemove,
}: {
  category: ClientRoomCategory;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.name);

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== category.name) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-sm"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>

      {editing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          className="w-24 bg-transparent text-sm outline-none"
        />
      ) : (
        <span className="select-none">{category.name}</span>
      )}

      <button
        type="button"
        onClick={() => {
          setEditValue(category.name);
          setEditing(true);
        }}
        className="text-muted-foreground hover:text-foreground"
        title="แก้ไขชื่อ"
      >
        <Pencil className="size-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-red-500"
        title="ลบหมวดหมู่"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

/* ---------- Document Card ---------- */

function CollapsibleDocumentCard({
  document,
  index,
  totalItems,
  section,
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
  section: ClientRoomSection;
  handleProps: Record<string, unknown>;
  onRemove: () => void;
  onMove: (newIndex: number) => void;
  uploadingTarget: string;
  onFieldChange: (updater: (doc: ClientRoomDocument) => ClientRoomDocument) => void;
  onFileUpload: (file: File | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [orderInput, setOrderInput] = useState("");

  const categoryLabel = document.categoryId
    ? getCategoryName(section, document.categoryId)
    : "";

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
      {/* Collapsed row: grip + order + thumbnail + title + category badge + expand/collapse + delete */}
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
          <div className="flex items-center gap-2">
            {document.version ? (
              <p className="truncate text-xs text-muted-foreground">{document.version}</p>
            ) : null}
            {categoryLabel ? (
              <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                {categoryLabel}
              </span>
            ) : null}
          </div>
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
          {section.categories.length > 0 ? (
            <Field label="หมวดหมู่">
              <select
                value={document.categoryId}
                onChange={(e) =>
                  onFieldChange((c) => ({ ...c, categoryId: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">— ไม่ระบุหมวดหมู่ —</option>
                {section.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
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
                checked={document.checked}
                onChange={(e) => onFieldChange((c) => ({ ...c, checked: e.target.checked }))}
              />
              Checked / approved
            </label>
            <span className="text-sm text-muted-foreground">
              เลือก Latest ที่ระดับ Revise ด้านบน
            </span>
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
