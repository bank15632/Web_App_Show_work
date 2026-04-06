import { jsPDF } from "jspdf";

import type { ProjectDocument } from "@/lib/portal-data";

export type PdfPageOrientation = "portrait" | "landscape";

export interface PdfPageFormat {
  width: number;
  height: number;
}

/**
 * Fetch an image URL and return it as a base64 data URL.
 * Returns null if the fetch fails.
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Load an image element from a data URL to get its natural dimensions.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export interface PdfExportProgress {
  current: number;
  total: number;
}

export function getPdfPageOrientation(
  imageWidth: number,
  imageHeight: number,
): PdfPageOrientation {
  return imageWidth >= imageHeight ? "landscape" : "portrait";
}

export function getPdfPageFormat(
  imageWidth: number,
  imageHeight: number,
): PdfPageFormat {
  return {
    width: imageWidth,
    height: imageHeight,
  };
}

/**
 * Collect all image documents from a section and export them as a single PDF.
 * Each image is placed on its own page using the image's native size.
 */
export async function exportSectionImagesToPdf(
  documents: ProjectDocument[],
  sectionLabel: string,
  projectTitle: string,
  onProgress?: (progress: PdfExportProgress) => void,
): Promise<void> {
  const imageUrls = documents
    .map((doc) => doc.downloadUrl || doc.viewerUrl || "")
    .filter(Boolean);

  if (imageUrls.length === 0) return;

  let pdf: jsPDF | null = null;
  let pagesAdded = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    onProgress?.({ current: i + 1, total: imageUrls.length });

    const dataUrl = await fetchImageAsDataUrl(imageUrls[i]);
    if (!dataUrl) continue;

    try {
      const img = await loadImage(dataUrl);
      const orientation = getPdfPageOrientation(img.naturalWidth, img.naturalHeight);
      const pageFormat = getPdfPageFormat(img.naturalWidth, img.naturalHeight);

      if (!pdf) {
        pdf = new jsPDF({
          orientation,
          unit: "px",
          format: [pageFormat.width, pageFormat.height],
          hotfixes: ["px_scaling"],
        });
      } else {
        pdf.addPage([pageFormat.width, pageFormat.height], orientation);
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

      pdf.addImage(
        dataUrl,
        format,
        0,
        0,
        pageWidth,
        pageHeight,
      );
      pagesAdded++;
    } catch {
      // Skip images that can't be loaded
    }
  }

  if (!pdf || pagesAdded === 0) return;

  const safeName = `${projectTitle} - ${sectionLabel}`.replace(/[^a-zA-Z0-9\u0E01-\u0E59\s_-]/g, "").trim();
  pdf.save(`${safeName}.pdf`);
}
