"use client";

import type { TimelineEvent } from "@/lib/portal-data";
import { formatPortalDate } from "@/lib/portal-data";

export function ProjectTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16 xl:px-12">
        <div className="mb-8">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
            Timeline
          </p>
          <h2 className="mt-2 font-display text-4xl leading-none md:text-5xl">
            ลำดับงาน
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border md:left-1/2 md:-translate-x-px" />

          <div className="space-y-8">
            {events.map((event, i) => (
              <div
                key={event.id}
                className={`relative flex items-start gap-6 md:gap-0 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-0 top-1 z-10 md:left-1/2 md:-translate-x-1/2">
                  <div
                    className={`size-[22px] rounded-full border-[3px] ${
                      event.completed
                        ? "border-foreground bg-foreground"
                        : "border-border bg-background"
                    }`}
                  />
                </div>

                {/* Content */}
                <div
                  className={`ml-10 w-full md:ml-0 md:w-[calc(50%-2rem)] ${
                    i % 2 === 0 ? "md:pr-4 md:text-right" : "md:pl-4"
                  }`}
                >
                  <div
                    className={`rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${
                      event.completed
                        ? "border-border bg-background"
                        : "border-dashed border-border bg-secondary/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatPortalDate(event.date)}
                    </p>
                    <p className="mt-1.5 text-base font-semibold">
                      {event.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    {event.completed && (
                      <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        เสร็จแล้ว
                      </span>
                    )}
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block md:w-[calc(50%-2rem)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
