import { AdminEventUpdatePage } from "@/components/admin/Events/AdminEventUpdate";
import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Update Event & League Details | Admin | PickleHub",
  description: "Update event and league details.",
};

type Params = { eventId: string };

export default async function AdminEventUpdate({
  params,
}: PageProps<Params>) {
  const { eventId } = await params;

  return <AdminEventUpdatePage eventId={eventId} />;
}
