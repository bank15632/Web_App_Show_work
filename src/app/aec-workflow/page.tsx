import type { Metadata } from "next";

import { AecWorkflowView } from "@/components/portal/aec-workflow-view";

export const metadata: Metadata = {
  title: "AEC Workflow Platform",
  description:
    "Strategy and development roadmap for the AEC Workflow Platform.",
};

export default function AecWorkflowPage() {
  return <AecWorkflowView />;
}
