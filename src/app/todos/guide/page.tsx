import type { Metadata } from "next";

import { SystemGuidePage } from "@/components/portal/system-guide";
import { getManualSystemGuide } from "@/lib/aec-user-manual";

export const metadata: Metadata = {
  title: "Kanban Guide",
  description:
    "Kanban workflow guide for project execution, review queue, and board updates in the AEC Workflow Platform.",
};

export default function TodosGuidePage() {
  const guide = getManualSystemGuide("kanban");

  if (!guide) return null;

  return <SystemGuidePage guide={guide} />;
}
