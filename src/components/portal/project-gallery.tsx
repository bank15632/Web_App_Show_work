"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

import type { GalleryImage } from "@/lib/portal-data";

export function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  const goNext = () => setCurrent((i) => (i + 1) % images.length);
  const goPrev = () => setCurrent((i) => (i - 1 + images.length) % images.length);

  const image = images[current];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16 xl:px-12">
        <div className="mb-8">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
            Gallery
          </p>
          <h2 className="mt-2 font-display text-4xl leading-none md:text-5xl">
            ผลงานสำเร็จ
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-secondary/30">
          {/* Image area */}
          <div className="relative flex aspect-[16/10] items-center justify-center bg-secondary">
            {/* Placeholder — replace with real <img> once images are uploaded */}
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <ImageIcon className="size-16 opacity-30" />
              <p className="text-sm font-medium">{image.caption}</p>
              <p className="text-xs opacity-60">
                รูปจะแสดงที่นี่เมื่อ upload แล้ว
              </p>
            </div>

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur transition-all hover:bg-background hover:shadow-lg"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur transition-all hover:bg-background hover:shadow-lg"
                  aria-label="Next"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {image.caption}
            </p>
            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              {current + 1} / {images.length}
            </p>
          </div>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 border-t border-border px-6 py-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrent(i)}
                  className={`size-2 rounded-full transition-all ${
                    i === current
                      ? "scale-125 bg-foreground"
                      : "bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
