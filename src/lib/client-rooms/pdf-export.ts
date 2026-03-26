import { jsPDF } from "jspdf";

import type { ProjectDocument } from "@/lib/portal-data";

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

/**
 * Collect all image documents from a section and export them as a single PDF.
 * Each image is placed on its own page, scaled to fit A4.
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

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  let pagesAdded = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    onProgress?.({ current: i + 1, total: imageUrls.length });

    const dataUrl = await fetchImageAsDataUrl(imageUrls[i]);
    if (!dataUrl) continue;

    try {
      const img = await loadImage(dataUrl);
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const contentRatio = contentWidth / contentHeight;

      let drawWidth: number;
      let drawHeight: number;

      if (imgRatio > contentRatio) {
        drawWidth = contentWidth;
        drawHeight = contentWidth / imgRatio;
      } else {
        drawHeight = contentHeight;
        drawWidth = contentHeight * imgRatio;
      }

      const x = margin + (contentWidth - drawWidth) / 2;
      const y = margin + (contentHeight - drawHeight) / 2;

      if (pagesAdded > 0) {
        pdf.addPage();
      }

      const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(dataUrl, format, x, y, drawWidth, drawHeight);
      pagesAdded++;
    } catch {
      // Skip images that can't be loaded
    }
  }

  if (pagesAdded === 0) return;

  const safeName = `${projectTitle} - ${sectionLabel}`.replace(/[^a-zA-Z0-9ก-๙\s_-]/g, "").trim();
  pdf.save(`${safeName}.pdf`);
}
