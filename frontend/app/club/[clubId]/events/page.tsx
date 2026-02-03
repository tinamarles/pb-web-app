import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { getClubEvents } from "@/lib/actions";
import { EventListFilters } from "@/lib/definitions";
import { EventFilterType, EventFilterStatus, EventCardModes } from "@/lib/constants";
import { ClubEventsClient } from "@/components/club/ClubEventsClient";

export const metadata: Metadata = {
  title: "Club Details | Club | PickleHub",
  description: "View the details of the selected club.",
};

type Params = { clubId: string };
type SearchParams = { intent?: string };

export default async function ClubEventsPage({
  params,
  searchParams,
}: PageProps<Params, SearchParams>) {
  const { clubId } = await params;

  // await the searchParams (a Promise) and extract intent
  const resolvedSearchParams = await searchParams;
  const intent = resolvedSearchParams?.intent;

  // 🎯 Determine mode from query param
  const isJoinMode = intent === "join";

  // build filters:
  const filters: EventListFilters = {
    type: EventFilterType.ALL, // events + leagues
    status: EventFilterStatus.UPCOMING, // upcoming + past
    page: "1", // ✅ "Give me page NUMBER 1"
    pageSize: "20", // ✅ "20 items per page"
    includeUserParticipation: true,
  };
  const requireAuth = true;
  const {
    results: events,
    count,
    next,
    previous,
  } = await getClubEvents(clubId, filters, requireAuth);
  
  return (
    <div className="flex flex-col gap-md">
      <ClubEventsClient 
        events={events} 
        joinMode={isJoinMode} 
        cardMode={EventCardModes.CLUB_EVENTS}
        gridLimit={false}
        showHeader={false}
        showActions={true}
      />
    </div>
  );
}
