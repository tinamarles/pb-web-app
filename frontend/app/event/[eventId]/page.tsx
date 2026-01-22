import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { EventDetailsClientPage } from "@/components/event/EventDetailsClientPage";

export const metadata: Metadata = {
  title: "League & Event Details | Club | PickleHub",
  description: "View the details of the selected league or event.",
};

type Params = { eventId: string };

export default async function EventDetailsPage({ params }: PageProps<Params>) {
  const { eventId } = await params;

  return <EventDetailsClientPage eventId={eventId} />;
}
