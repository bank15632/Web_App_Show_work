import type { Metadata } from "next";

import { SettingsView } from "@/components/portal/settings-view";

export const metadata: Metadata = {
  title: "Settings & Export",
  description:
    "Profile, notifications, and data export settings for the AEC Workflow Platform.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
