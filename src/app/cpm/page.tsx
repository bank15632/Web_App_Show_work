import type { Metadata } from "next";

import { SystemGuidePage } from "@/components/portal/system-guide";
import { getManualSystemGuide } from "@/lib/aec-user-manual";

export const metadata: Metadata = {
  title: "CPM Guide",
  description:
    "CPM workflow guide for milestones, dependencies, and lookahead planning in the AEC Workflow Platform.",
};

export default function CpmPage() {
  const guide = getManualSystemGuide("cpm");

  if (!guide) return null;

  return <SystemGuidePage guide={guide} />;
}
