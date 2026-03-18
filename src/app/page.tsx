import type { Metadata } from "next";

import { DashboardView } from "@/components/portal/dashboard-view";

export const metadata: Metadata = {
  title: "Owner Dashboard",
};

export default function HomePage() {
  return <DashboardView />;
}
