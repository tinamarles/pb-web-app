import { AdminEventSchedulePage } from "@/components/admin/Events/AdminEventSchedule";
import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Event & League Schedule | Admin | PickleHub",
  description: "View and manage event and league Schedule.",
};

type Params = { eventId: string };

export default async function AdminEventSchedule({
  params,
}: PageProps<Params>) {
  const { eventId } = await params;

  return <AdminEventSchedulePage eventId={eventId} />;
}
