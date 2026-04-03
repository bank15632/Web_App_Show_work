import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const DashboardView = dynamic(
  () => import("@/components/portal/dashboard-view").then((mod) => mod.DashboardView),
  { loading: () => <PageSkeleton /> },
);

export const metadata: Metadata = {
  title: "Workflow Dashboard",
};

export default function HomePage() {
  return (
    <ErrorBoundary>
      <DashboardView />
    </ErrorBoundary>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-5 lg:px-10">
        <div className="h-8 w-40 rounded-lg skeleton-shimmer" />
      </div>
      <div className="space-y-6 px-6 py-10 lg:px-10">
        <div className="h-48 rounded-[2rem] skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-[1.5rem] skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
