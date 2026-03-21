import type { Metadata } from "next";

import { SystemGuidePage } from "@/components/portal/system-guide";
import { getManualSystemGuide } from "@/lib/aec-user-manual";

export const metadata: Metadata = {
  title: "AI Assistant Guide",
  description:
    "AI assistant workflow guide for copy briefs, export data, and asking external AI in the AEC Workflow Platform.",
};

export default function AiAssistantPage() {
  const guide = getManualSystemGuide("ai-assistant");

  if (!guide) return null;

  return <SystemGuidePage guide={guide} />;
}
