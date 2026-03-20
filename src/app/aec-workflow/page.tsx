import type { Metadata } from "next";

import { AecWorkflowView } from "@/components/portal/aec-workflow-view";

export const metadata: Metadata = {
  title: "AEC Workflow Platform User Manual",
  description:
    "User manual, daily routine, settings, and framework overview for the AEC Workflow Platform.",
};

export default function AecWorkflowPage() {
  return <AecWorkflowView />;
}
