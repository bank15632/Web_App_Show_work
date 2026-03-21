"use client";

import type { ReactNode } from "react";
import { ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createEmptyGalleryImage,
  createEmptyGalleryRoom,
  type ClientRoomDraftData,
  type ClientRoomGalleryImage,
  type ClientRoomGalleryRoom,
} from "@/lib/client-rooms/types";

function buildImageCaption(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").trim();
}

export function ClientRoomGalleryEditor({
  draft,
  onChange,
  onUpload,
  uploadingTarget,
  onStatus,
}: {
  draft: ClientRoomDraftData;
  onChange: (updater: (draft: ClientRoomDraftData) => ClientRoomDraftData) => void;
  onUpload: (kind: "gallery", file: File) => Promise<string>;
  uploadingTarget: string;
  onStatus: (message: string) => void;
}) {
  function addGalleryImages(roomId: string, images: ClientRoomGalleryImage[]) {
    updateGalleryRoom(roomId, (room) => ({
      ...room,
      images: [...room.images, ...images],
    }));
  }

  function updateGalleryRoom(
    roomId: string,
    updater: (room: ClientRoomGalleryRoom) => ClientRoomGalleryRoom,
  ) {
    onChange((currentDraft) => ({
      ...currentDraft,
      gallery: currentDraft.gallery.map((room) => (room.id === roomId ? updater(room) : room)),
    }));
  }

  function updateGalleryImage(
    roomId: string,
    imageId: string,
    updater: (image: ClientRoomGalleryImage) => ClientRoomGalleryImage,
  ) {
    updateGalleryRoom(roomId, (room) => ({
      ...room,
      images: room.images.map((image) => (image.id === imageId ? updater(image) : image)),
    }));
  }

  async function handleGalleryImageUpload(
    roomId: string,
    imageId: string,
    file: File | null,
  ) {
    if (!file) {
      return;
    }

    try {
      const url = await onUpload("gallery", file);
      updateGalleryImage(roomId, imageId, (image) => ({
        ...image,
        src: url,
      }));
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "อัปโหลดรูป gallery ไม่สำเร็จ");
    }
  }

  async function handleRoomUpload(roomId: string, files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    if (nextFiles.length === 0) {
      return;
    }

    const images = nextFiles.map((file) => ({
      ...createEmptyGalleryImage(),
      caption: buildImageCaption(file.name),
    }));

    addGalleryImages(roomId, images);

    let successCount = 0;
    const failedFiles: string[] = [];

    for (const [index, file] of nextFiles.entries()) {
      const image = images[index];

      try {
        onStatus(`กำลังอัปโหลดรูป ${index + 1}/${nextFiles.length}: ${file.name}`);
        const url = await onUpload("gallery", file);
        updateGalleryImage(roomId, image.id, (current) => ({
          ...current,
          src: url,
        }));
        successCount += 1;
      } catch (error) {
        failedFiles.push(file.name);
        onStatus(error instanceof Error ? error.message : `อัปโหลด ${file.name} ไม่สำเร็จ`);
      }
    }

    if (failedFiles.length > 0) {
      onStatus(
        `อัปโหลดรูปสำเร็จ ${successCount}/${nextFiles.length} ไฟล์ ไฟล์ที่ยังต้อง retry: ${failedFiles.join(", ")}`,
      );
      return;
    }

    onStatus(`อัปโหลดรูป ${successCount} ไฟล์แล้ว`);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Gallery</CardTitle>
            <CardDescription>
              สร้างห้องและใส่รูปจริงที่ต้องการแสดงบนหน้า client room
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              onChange((currentDraft) => ({
                ...currentDraft,
                gallery: [...currentDraft.gallery, createEmptyGalleryRoom()],
              }))
            }
          >
            <Plus />
            เพิ่มห้อง
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มี gallery room</p>
        ) : null}

        {draft.gallery.map((room) => (
          <div key={room.id} className="space-y-4 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  value={room.name}
                  onChange={(event) =>
                    updateGalleryRoom(room.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="ชื่อห้อง"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  onChange((currentDraft) => ({
                    ...currentDraft,
                    gallery: currentDraft.gallery.filter((item) => item.id !== room.id),
                  }))
                }
              >
                <Trash2 />
                ลบห้อง
              </Button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                {uploadingTarget.startsWith("gallery:") ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                อัปหลายรูป
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void handleRoomUpload(room.id, event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="space-y-3">
              {room.images.map((image) => (
                <div
                  key={image.id}
                  className="grid gap-4 rounded-xl border border-border/70 p-3 md:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <div className="space-y-3">
                    <Field label="Caption">
                      <Input
                        value={image.caption}
                        onChange={(event) =>
                          updateGalleryImage(room.id, image.id, (current) => ({
                            ...current,
                            caption: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Image URL">
                      <Input
                        value={image.src}
                        onChange={(event) =>
                          updateGalleryImage(room.id, image.id, (current) => ({
                            ...current,
                            src: event.target.value,
                          }))
                        }
                        placeholder="/api/client-rooms/assets/..."
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                        {uploadingTarget.startsWith("gallery:") ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <ImagePlus className="size-4" />
                        )}
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            void handleGalleryImageUpload(
                              room.id,
                              image.id,
                              event.target.files?.[0] ?? null,
                            )
                          }
                        />
                      </label>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          updateGalleryRoom(room.id, (current) => ({
                            ...current,
                            images: current.images.filter((item) => item.id !== image.id),
                          }))
                        }
                      >
                        <Trash2 />
                        ลบรูป
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-secondary/30">
                    {image.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.src}
                        alt={image.caption || room.name}
                        className="aspect-[4/3] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                        ยังไม่มีรูป
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() =>
                updateGalleryRoom(room.id, (current) => ({
                  ...current,
                  images: [...current.images, createEmptyGalleryImage()],
                }))
              }
            >
              <Plus />
              เพิ่มรูป
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
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
