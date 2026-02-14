import { ModuleClientOnly as Module } from "@/shared";
import { PageProps, EmptyObject } from "@/lib/definitions";
import { Metadata } from "next";
import { getEvent } from "@/lib/actions";
import { EventDetailsClientPage } from "@/components/event/EventDetailsClientPage";
import { notFound } from "next/navigation";

type Params = { eventId: string };
type SearchParams = { sessionId?: string };

export const metadata: Metadata = {
  title: "League & Event Details | Club | PickleHub",
  description: "View the details of the selected league or event.",
};

export default async function EventDetailsPage({
  params,
  searchParams,
}: PageProps<Params, SearchParams>) {
  const { eventId } = await params;
  // await the searchParams (a Promise) and extract sessionId
  const resolvedSearchParams = await searchParams;
  const sessionId = resolvedSearchParams?.sessionId;

  // build filters:
  const filters = {
    includeUserParticipation: true,
  };
  const requireAuth = true;

  const event = await getEvent(eventId, filters, requireAuth);

  console.log("Event/[eventId] server page received: ", event);
  if (!event) {
    notFound();
  }

  return (
    <Module type="default">
      <div className="page__content">
        <EventDetailsClientPage event={event} />
      </div>
    </Module>
  );
}
