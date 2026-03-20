import type { Metadata } from "next";

import { GtdWorkspace } from "@/components/portal/gtd-workspace";

export const metadata: Metadata = {
  title: "GTD Workspace",
  description: "Inbox, buckets, clarify flow, and weekly review for the AEC workflow MVP.",
};

export default function GtdPage() {
  return <GtdWorkspace />;
}
