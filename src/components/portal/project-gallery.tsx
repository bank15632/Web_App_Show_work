import Image from "next/image";
import type { GalleryRoom } from "@/lib/portal-data";

type VisibleGalleryRoom = GalleryRoom;

export function ProjectGallery({ rooms }: { rooms: GalleryRoom[] }) {
  const visibleRooms = getVisibleGalleryRooms(rooms);

  if (visibleRooms.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 xl:px-12">
        <div className="mb-12">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-muted-foreground">
            Gallery
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            Project Images
          </h2>
        </div>

        <div className="space-y-12">
          {visibleRooms.map((room) => (
            <div key={room.id} className="space-y-6">
              {room.name ? (
                <h3 className="font-display text-2xl tracking-tight md:text-3xl">
                  {room.name}
                </h3>
              ) : null}

              <div className="space-y-10">
                {room.images.map((image) => (
                  <figure key={image.id} className="space-y-3">
                    <div className="overflow-hidden rounded-2xl bg-secondary">
                      <Image
                        src={image.src}
                        alt={image.caption || room.name}
                        width={1600}
                        height={1000}
                        unoptimized
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </div>
                    {image.caption ? (
                      <figcaption className="text-sm text-muted-foreground">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function getVisibleGalleryRooms(rooms: GalleryRoom[]): VisibleGalleryRoom[] {
  return rooms
    .map((room) => ({
      ...room,
      images: room.images.filter((image) => image.src.trim().length > 0),
    }))
    .filter((room) => room.images.length > 0);
}
