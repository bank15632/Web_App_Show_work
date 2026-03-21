import type { Metadata } from "next";

import { SystemGuidePage } from "@/components/portal/system-guide";
import { getManualSystemGuide } from "@/lib/aec-user-manual";

export const metadata: Metadata = {
  title: "GTD Guide",
  description:
    "GTD workflow guide for capture, clarify, weekly review, and personal work management in the AEC Workflow Platform.",
};

export default function GtdGuidePage() {
  const guide = getManualSystemGuide("gtd");

  if (!guide) return null;

  return <SystemGuidePage guide={guide} />;
}
