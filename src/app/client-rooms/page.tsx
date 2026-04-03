import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const ClientRoomCms = dynamic(
  () => import("@/components/portal/client-room-cms").then((mod) => mod.ClientRoomCms),
);

type ClientRoomsPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function ClientRoomsPage({ searchParams }: ClientRoomsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  return (
    <ErrorBoundary>
      <ClientRoomCms initialProjectId={params?.projectId ?? ""} />
    </ErrorBoundary>
  );
}
