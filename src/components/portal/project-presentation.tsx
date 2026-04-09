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

function clampSlideIndex(index: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), total - 1);
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1);
  const dragStartXRef = useRef<number | null>(null);
  const ignoreNextTapRef = useRef(false);
  const nativeFullscreenRef = useRef(false);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function syncViewportWidth() {
      setViewportWidth(window.innerWidth || 1);
    }

    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth);

    return () => {
      window.removeEventListener("resize", syncViewportWidth);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const doc = document as FullscreenDocument;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    if (getFullscreenElement(doc)) {
      nativeFullscreenRef.current = true;
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
        setActiveIndex((current) => clampSlideIndex(current - 1, slides.length));
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => clampSlideIndex(current + 1, slides.length));
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
  }, [isOpen, slides.length]);

  function openPresentation(slideId?: string) {
    if (!hasSlides) {
      return;
    }

    const nextIndex = slideId
      ? slides.findIndex((slide) => slide.id === slideId)
      : 0;

    setActiveIndex(clampSlideIndex(nextIndex >= 0 ? nextIndex : 0, slides.length));
    setControlsVisible(false);
    setDragOffset(0);
    setIsDragging(false);
    setIsOpen(true);

    if (typeof document !== "undefined") {
      const doc = document as FullscreenDocument;
      void requestElementFullscreen(document.documentElement as FullscreenTarget).then((entered) => {
        nativeFullscreenRef.current = entered || Boolean(getFullscreenElement(doc));
      });
    }
  }

  function closePresentation() {
    setControlsVisible(false);
    setDragOffset(0);
    setIsDragging(false);
    setIsOpen(false);
  }

  function goToPreviousSlide() {
    setActiveIndex((current) => clampSlideIndex(current - 1, slides.length));
  }

  function goToNextSlide() {
    setActiveIndex((current) => clampSlideIndex(current + 1, slides.length));
  }

  function toggleControls() {
    if (ignoreNextTapRef.current) {
      ignoreNextTapRef.current = false;
      return;
    }

    setControlsVisible((current) => !current);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    dragStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    ignoreNextTapRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const startX = dragStartXRef.current;
    if (startX === null) {
      return;
    }

    const currentX = event.changedTouches[0]?.clientX ?? startX;
    const rawDelta = currentX - startX;
    const atFirstSlide = activeIndex === 0;
    const atLastSlide = activeIndex === slides.length - 1;
    const resistedDelta =
      (atFirstSlide && rawDelta > 0) || (atLastSlide && rawDelta < 0)
        ? rawDelta * 0.35
        : rawDelta;

    if (Math.abs(rawDelta) > 6) {
      ignoreNextTapRef.current = true;
    }

    setDragOffset(resistedDelta);
    event.preventDefault();
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = dragStartXRef.current;
    dragStartXRef.current = null;
    setIsDragging(false);

    if (startX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const rawDelta = endX - startX;
    const threshold = Math.min(140, Math.max(48, viewportWidth * 0.14));

    if (rawDelta <= -threshold && activeIndex < slides.length - 1) {
      setActiveIndex((current) => clampSlideIndex(current + 1, slides.length));
    } else if (rawDelta >= threshold && activeIndex > 0) {
      setActiveIndex((current) => clampSlideIndex(current - 1, slides.length));
    }

    setDragOffset(0);
  }

  const currentIndex = clampSlideIndex(activeIndex, slides.length);
  const activeSlide = slides[currentIndex] ?? null;
  const translateX = -currentIndex * viewportWidth + dragOffset;

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
            <div
              className="absolute inset-0 overflow-hidden"
              onClick={toggleControls}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "pan-y" }}
            >
              <div
                className="flex h-full"
                style={{
                  width: `${slides.length * viewportWidth}px`,
                  transform: `translate3d(${translateX}px, 0, 0)`,
                  transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="flex h-full shrink-0 items-center justify-center bg-black"
                    style={{ width: `${viewportWidth}px` }}
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      width={1600}
                      height={1200}
                      sizes="100vw"
                      loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                      priority={index === currentIndex}
                      draggable={false}
                      className="h-full w-full select-none object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {controlsVisible ? (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-end bg-gradient-to-b from-black/78 via-black/28 to-transparent px-4 pb-16 pt-4 md:px-6 md:pb-20 md:pt-6">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      closePresentation();
                    }}
                    className="pointer-events-auto inline-flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition-colors hover:border-white/30 hover:bg-black/72"
                    aria-label="Close presentation"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/34 to-transparent px-4 pb-6 pt-16 md:px-6 md:pb-8 md:pt-24">
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
                          disabled={currentIndex === 0}
                        />
                        <PresentationNavButton
                          label="Next"
                          onClick={goToNextSlide}
                          icon={<ChevronRight className="size-4" />}
                          disabled={currentIndex === slides.length - 1}
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
                        disabled={currentIndex === 0}
                      />
                      <PresentationNavButton
                        label="Next"
                        onClick={goToNextSlide}
                        icon={<ChevronRight className="size-4" />}
                        className="justify-center"
                        disabled={currentIndex === slides.length - 1}
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
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-black/72 disabled:opacity-35",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
