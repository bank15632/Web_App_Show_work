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
    const kindLabel = kind === "canva" ? "Canva board" : "PDF set";

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border border-border bg-secondary/60",
          className,
        )}
      >
        <div className="absolute inset-x-6 top-6 h-px bg-border/90" />

        <div className="grid min-h-[18rem] gap-6 p-6">
          <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
            <span>{kindLabel}</span>
            <span>Preview placeholder</span>
          </div>

          <div className="grid flex-1 gap-4 md:grid-cols-[0.85fr_1.15fr] md:items-end">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
                {kind === "canva" ? (
                  <LayoutTemplate className="size-5 text-foreground" />
                ) : (
                  <FileText className="size-5 text-foreground" />
                )}
              </div>

              <div>
                <p className="font-display text-3xl leading-tight text-foreground">
                  {title}
                </p>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  {summary}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border bg-background/90 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Source
                </p>
                <div className="mt-8 rounded-[1.25rem] border border-border bg-muted p-4">
                  <p className="font-medium text-foreground">{kindLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    เชื่อมลิงก์จริงภายหลังได้
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background/90 p-4">
                <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="size-3.5 text-foreground" />
                  Fallback mode
                </div>
                <div className="mt-4 space-y-3">
                  <div className="h-20 rounded-[1.25rem] border border-border bg-muted" />
                  <div className="h-12 rounded-[1.25rem] border border-border bg-muted/70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-border bg-background",
        className,
      )}
    >
      <iframe
        title={title}
        src={previewUrl}
        className="h-full min-h-[18rem] w-full bg-background"
        loading="lazy"
      />
    </div>
  );
}
