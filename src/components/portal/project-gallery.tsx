"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import type { GalleryRoom } from "@/lib/portal-data";

export function ProjectGallery({ rooms }: { rooms: GalleryRoom[] }) {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? "");

  if (rooms.length === 0) return null;

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0];

  return (
    <section className="border-t border-border">
      {/* Sticky room tabs */}
      <div className="sticky top-[73px] z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-8 overflow-x-auto px-5 py-4 md:px-8 xl:px-12">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`shrink-0 border-b-2 pb-1 text-sm transition-colors ${
                activeRoom.id === room.id
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical image list — scroll down to see each image */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 xl:px-12">
        <div className="space-y-10">
          {activeRoom.images.map((image) => (
            <div key={image.id} className="space-y-3">
              {image.src ? (
                <div className="overflow-hidden rounded-2xl bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.caption}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="size-16 opacity-30" />
                    <p className="text-sm font-medium">{image.caption}</p>
                    <p className="text-xs opacity-60">
                      รูปจะแสดงที่นี่เมื่อ upload แล้ว
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{image.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
