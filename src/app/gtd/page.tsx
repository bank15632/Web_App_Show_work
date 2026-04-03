import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const GtdWorkspace = dynamic(
  () => import("@/components/portal/gtd-workspace").then((mod) => mod.GtdWorkspace),
  { loading: () => <PageSkeleton /> },
);

export const metadata: Metadata = {
  title: "GTD Workspace",
  description: "Inbox, buckets, clarify flow, and weekly review for the AEC workflow MVP.",
};

export default function GtdPage() {
  return (
    <ErrorBoundary>
      <GtdWorkspace />
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
        <div className="h-40 rounded-[2rem] skeleton-shimmer" />
        <div className="h-64 rounded-[2rem] skeleton-shimmer" />
      </div>
    </div>
  );
}
