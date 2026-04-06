"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import type { ClientProject, ProjectPresentationSlide } from "@/lib/portal-data";
import { getProjectPresentationSlides } from "@/lib/portal-data";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

type ProjectPresentationContextValue = {
  hasSlides: boolean;
  slides: ProjectPresentationSlide[];
  openPresentation: (slideId?: string) => void;
};

type FullscreenTarget = HTMLElement & {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

const ProjectPresentationContext = createContext<ProjectPresentationContextValue | null>(null);

function getFullscreenElement(doc: FullscreenDocument) {
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

async function requestElementFullscreen(element: FullscreenTarget | null) {
  if (!element) {
    return false;
  }

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    }

    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      return true;
    }

    if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

async function exitElementFullscreen(doc: FullscreenDocument) {
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return;
    }

    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return;
    }

    if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch {
    // Ignore fullscreen exit failures and keep the overlay fallback visible.
  }
}

export function ProjectPresentationProvider({
  project,
  children,
}: {
  project: ClientProject;
  children: ReactNode;
}) {
  const slides = useMemo(() => getProjectPresentationSlides(project), [project]);
  const hasSlides = slides.length > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const ignoreNextTapRef = useRef(false);
  const nativeFullscreenRef = useRef(false);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const doc = document as FullscreenDocument;
    const previousOverflow = document.body.style.overflow;
    let cancelled = false;

    document.body.style.overflow = "hidden";

    if (!getFullscreenElement(doc)) {
      void requestElementFullscreen(trapRef.current as FullscreenTarget | null).then((entered) => {
        if (!cancelled) {
          nativeFullscreenRef.current = entered;
        }
      });
    } else {
      nativeFullscreenRef.current = true;
    }

    if (cancelled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (slides.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % slides.length);
      }
    }

    function handleFullscreenChange() {
      if (nativeFullscreenRef.current && !getFullscreenElement(doc)) {
        nativeFullscreenRef.current = false;
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange as EventListener);

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange as EventListener);

      if (nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        void exitElementFullscreen(doc);
      }
    };
  }, [isOpen, slides.length, trapRef]);

  function openPresentation(slideId?: string) {
    if (!hasSlides) {
      return;
    }

    const nextIndex = slideId
      ? slides.findIndex((slide) => slide.id === slideId)
      : 0;

    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    setControlsVisible(false);
    setIsOpen(true);

    if (typeof document !== "undefined") {
      void requestElementFullscreen(document.documentElement as FullscreenTarget).then((entered) => {
        nativeFullscreenRef.current = entered;
      });
    }
  }

  function closePresentation() {
    setControlsVisible(false);
    setIsOpen(false);
  }

  function goToPreviousSlide() {
    if (slides.length <= 1) {
      return;
    }

    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function goToNextSlide() {
    if (slides.length <= 1) {
      return;
    }

    setActiveIndex((current) => (current + 1) % slides.length);
  }

  function toggleControls() {
    if (ignoreNextTapRef.current) {
      ignoreNextTapRef.current = false;
      return;
    }

    setControlsVisible((current) => !current);
  }

  function handleTouchStart(event: TouchEvent<HTMLButtonElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    ignoreNextTapRef.current = false;
  }

  function handleTouchEnd(event: TouchEvent<HTMLButtonElement>) {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;

    if (startX === null || slides.length <= 1) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) < 40) {
      return;
    }

    ignoreNextTapRef.current = true;

    if (deltaX < 0) {
      goToNextSlide();
      return;
    }

    goToPreviousSlide();
  }

  const currentIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[currentIndex] ?? null;

  return (
    <ProjectPresentationContext.Provider
      value={{
        hasSlides,
        slides,
        openPresentation,
      }}
    >
      {children}

      {isOpen && activeSlide ? (
        <div className="fixed inset-0 z-[80] bg-black">
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Slide presentation"
            className="relative h-full w-full overflow-hidden bg-black"
          >
            <button
              type="button"
              onClick={toggleControls}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="absolute inset-0 flex h-full w-full items-center justify-center bg-black"
              aria-label={controlsVisible ? "Hide slide details" : "Show slide details"}
            >
              <Image
                src={activeSlide.src}
                alt={activeSlide.alt}
                width={1600}
                height={1200}
                sizes="100vw"
                unoptimized
                priority
                className="h-full w-full object-contain"
              />
            </button>

            {controlsVisible ? (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-end bg-gradient-to-b from-black/75 via-black/30 to-transparent px-4 pb-14 pt-4 md:px-6 md:pb-20 md:pt-6">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      closePresentation();
                    }}
                    className="pointer-events-auto inline-flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white transition-colors hover:border-white/30 hover:bg-black/70"
                    aria-label="Close presentation"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-6 pt-16 md:px-6 md:pb-8 md:pt-24">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/88">
                        {currentIndex + 1} / {slides.length}
                      </p>
                      <h2 className="mt-1 truncate text-base font-medium text-white md:text-xl">
                        {activeSlide.title}
                      </h2>
                    </div>

                    {slides.length > 1 ? (
                      <div className="pointer-events-auto hidden items-center gap-2 md:flex">
                        <PresentationNavButton
                          label="Previous"
                          onClick={goToPreviousSlide}
                          icon={<ChevronLeft className="size-4" />}
                        />
                        <PresentationNavButton
                          label="Next"
                          onClick={goToNextSlide}
                          icon={<ChevronRight className="size-4" />}
                        />
                      </div>
                    ) : null}
                  </div>

                  {slides.length > 1 ? (
                    <div className="pointer-events-auto mt-4 grid grid-cols-2 gap-2 md:hidden">
                      <PresentationNavButton
                        label="Previous"
                        onClick={goToPreviousSlide}
                        icon={<ChevronLeft className="size-4" />}
                        className="justify-center"
                      />
                      <PresentationNavButton
                        label="Next"
                        onClick={goToNextSlide}
                        icon={<ChevronRight className="size-4" />}
                        className="justify-center"
                      />
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </ProjectPresentationContext.Provider>
  );
}

export function useProjectPresentation() {
  const context = useContext(ProjectPresentationContext);

  if (!context) {
    throw new Error("useProjectPresentation must be used within ProjectPresentationProvider");
  }

  return context;
}

export function ProjectPresentationLaunchButton({
  slideId,
  className,
  children,
}: {
  slideId?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { hasSlides, openPresentation } = useProjectPresentation();

  if (!hasSlides) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openPresentation(slideId)}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground hover:bg-secondary/40",
        className,
      )}
    >
      {children ?? (
        <>
          <Expand className="size-4" />
          Slide Presentation
        </>
      )}
    </button>
  );
}

function PresentationNavButton({
  label,
  icon,
  onClick,
  className,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-black/70",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
