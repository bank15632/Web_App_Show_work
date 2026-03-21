import { ClientRoomCms } from "@/components/portal/client-room-cms";

type ClientRoomsPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function ClientRoomsPage({ searchParams }: ClientRoomsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  return <ClientRoomCms initialProjectId={params?.projectId ?? ""} />;
}
