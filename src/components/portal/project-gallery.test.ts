import { describe, expect, it } from "vitest";

import { getVisibleGalleryRooms } from "@/components/portal/project-gallery";
import type { GalleryRoom } from "@/lib/portal-data";

describe("getVisibleGalleryRooms", () => {
  it("keeps only uploaded images and preserves order", () => {
    const rooms: GalleryRoom[] = [
      {
        id: "living-room",
        name: "Living Room",
        images: [
          {
            id: "image-1",
            src: "https://example.com/1.jpg",
            caption: "First upload",
          },
          {
            id: "image-2",
            src: "",
            caption: "Placeholder",
          },
          {
            id: "image-3",
            src: "https://example.com/3.jpg",
            caption: "Third upload",
          },
        ],
      },
      {
        id: "empty-room",
        name: "Empty Room",
        images: [
          {
            id: "image-4",
            src: "",
            caption: "No upload yet",
          },
        ],
      },
    ];

    const visibleRooms = getVisibleGalleryRooms(rooms);

    expect(visibleRooms).toHaveLength(1);
    expect(visibleRooms[0]?.id).toBe("living-room");
    expect(visibleRooms[0]?.images.map((image) => image.id)).toEqual([
      "image-1",
      "image-3",
    ]);
  });
});
