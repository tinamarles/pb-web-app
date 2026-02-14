import { AdminEventDetailPage } from "@/components/admin/Events/AdminEventDetail";
import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Event & League Details | Admin | PickleHub",
  description: "View and manage event and league details.",
};

type Params = { eventId: string };

export default async function AdminEventDetailsPage({
  params,
}: PageProps<Params>) {
  const { eventId } = await params;

  return <AdminEventDetailPage eventId={eventId} />;
}
