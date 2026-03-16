import { FileText, LayoutTemplate, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DocumentKind } from "@/lib/portal-data";

export function DocumentPreview({
  title,
  summary,
  kind,
  previewUrl,
  className,
}: {
  title: string;
  summary: string;
  kind: DocumentKind;
  previewUrl: string;
  className?: string;
}) {
  if (previewUrl.startsWith("/preview/")) {
    return (
      <div
        className={cn(
          "flex min-h-64 flex-col justify-between rounded-3xl border border-dashed border-border bg-canvas p-5",
          className,
        )}
      >
        <div className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary">
            {kind === "canva" ? (
              <LayoutTemplate className="size-5 text-foreground" />
            ) : (
              <FileText className="size-5 text-foreground" />
            )}
          </div>
          <div>
            <p className="font-display text-xl font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-background/80 p-4 text-sm leading-6 text-ink-soft">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="size-4 text-primary" />
            Built-in preview fallback
          </div>
          <p className="mt-2">
            ตอน deploy จริง ให้แทนที่ fallback นี้ด้วย Canva embed URL หรือ PDF path
            เพื่อให้ลูกค้าเปิดดูไฟล์บนเว็บได้ทันที
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-border bg-background", className)}>
      <iframe
        title={title}
        src={previewUrl}
        className="h-72 w-full bg-background"
        loading="lazy"
      />
    </div>
  );
}
