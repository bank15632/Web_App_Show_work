import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const SettingsView = dynamic(
  () => import("@/components/portal/settings-view").then((mod) => mod.SettingsView),
  { loading: () => <PageSkeleton /> },
);

export const metadata: Metadata = {
  title: "Settings & Export",
  description:
    "Profile, notifications, and data export settings for the AEC Workflow Platform.",
};

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsView />
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
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-64 rounded-[2rem] skeleton-shimmer" />
          <div className="h-64 rounded-[2rem] skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
