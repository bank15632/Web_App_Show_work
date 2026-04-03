import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const AecWorkflowView = dynamic(
  () => import("@/components/portal/aec-workflow-view").then((mod) => mod.AecWorkflowView),
);

export const metadata: Metadata = {
  title: "AEC Workflow Platform User Manual",
  description:
    "User manual, daily routine, settings, and framework overview for the AEC Workflow Platform.",
};

export default function AecWorkflowPage() {
  return (
    <ErrorBoundary>
      <AecWorkflowView />
    </ErrorBoundary>
  );
}
