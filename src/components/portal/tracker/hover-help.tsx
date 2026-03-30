"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";

export function HoverHelp({
  label,
  body,
  buttonLabel,
  className,
  panelClassName,
}: {
  label: string;
  body: string;
  buttonLabel?: string;
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={buttonLabel ?? label}
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground focus-visible:outline-none"
        onClick={() => setOpen((value) => !value)}
      >
        <CircleHelp className="size-4" />
      </button>
      <div
        role="tooltip"
        className={cn(
          "absolute right-0 top-full z-30 mt-2 w-72 rounded-[1rem] border border-border bg-background px-4 py-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.12)]",
          open ? "block" : "hidden",
          panelClassName,
        )}
      >
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {label}
        </p>
        <p className="mt-2 whitespace-pre-line text-[12px] leading-6 text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
