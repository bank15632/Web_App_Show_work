"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type ReactNode,
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

const ProjectPresentationContext = createContext<ProjectPresentationContextValue | null>(null);

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
  const touchStartXRef = useRef<number | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, slides.length]);

  function openPresentation(slideId?: string) {
    if (!hasSlides) {
      return;
    }

    const nextIndex = slideId
      ? slides.findIndex((slide) => slide.id === slideId)
      : 0;

    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    setIsOpen(true);
  }

  function closePresentation() {
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

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
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
        <div className="fixed inset-0 z-[80] bg-black text-white">
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Slide presentation"
            className="flex h-full flex-col"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
              <div className="min-w-0">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/55">
                  Slide Presentation
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {currentIndex + 1} / {slides.length}
                </p>
              </div>

              <button
                type="button"
                onClick={closePresentation}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/15"
              >
                <X className="size-4" />
                Close
              </button>
            </div>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                onClick={goToPreviousSlide}
                disabled={slides.length <= 1}
                className="absolute inset-y-0 left-0 z-10 hidden w-24 md:block"
                aria-label="Previous slide"
              />
              <button
                type="button"
                onClick={goToNextSlide}
                disabled={slides.length <= 1}
                className="absolute inset-y-0 right-0 z-10 hidden w-24 md:block"
                aria-label="Next slide"
              />

              <div className="flex h-full w-full items-center justify-center px-4 pb-24 pt-4 md:px-10 md:pb-28">
                <Image
                  src={activeSlide.src}
                  alt={activeSlide.alt}
                  width={1600}
                  height={1200}
                  unoptimized
                  className="max-h-full max-w-full object-contain"
                  priority
                />
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/70 px-4 py-4 backdrop-blur md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/45">
                    {activeSlide.subtitle}
                  </p>
                  <h2 className="mt-2 text-lg font-medium text-white md:text-2xl">
                    {activeSlide.title}
                  </h2>
                  {activeSlide.description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-white/72">
                      {activeSlide.description}
                    </p>
                  ) : null}
                  {slides.length > 1 ? (
                    <p className="mt-3 text-xs text-white/45">
                      Swipe on mobile or use the navigation buttons to move between slides.
                    </p>
                  ) : null}
                </div>

                {slides.length > 1 ? (
                  <div className="hidden items-center gap-2 md:flex">
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
                <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
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
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/15",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
