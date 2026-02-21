import { AdminEventAnnouncementsPage } from "@/components/admin/Events/AdminEventAnnouncements";
import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Event & League Announcements | Admin | PickleHub",
  description: "View and manage event and league announcements.",
};

type Params = { eventId: string };

export default async function AdminEventAnnouncements({
  params,
}: PageProps<Params>) {
  const { eventId } = await params;

  return <AdminEventAnnouncementsPage eventId={eventId} />;
}
