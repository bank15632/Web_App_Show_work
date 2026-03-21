import type { Metadata } from "next";

import { SystemGuidePage } from "@/components/portal/system-guide";
import { getManualSystemGuide } from "@/lib/aec-user-manual";

export const metadata: Metadata = {
  title: "Lean Guide",
  description:
    "Lean workflow guide for waste analysis, retrospective, and kaizen in the AEC Workflow Platform.",
};

export default function LeanPage() {
  const guide = getManualSystemGuide("lean");

  if (!guide) return null;

  return <SystemGuidePage guide={guide} />;
}
