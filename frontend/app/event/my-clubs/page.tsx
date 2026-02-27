import { Metadata } from "next";
import { getMyClubsEvents } from "@/lib/actions";
import { PageProps, EmptyObject, EventListFilters } from "@/lib/definitions";
import {
  EventFilterType,
  EventFilterStatus,
  EventCardModes,
} from "@/lib/constants";
import { ModuleClientOnly as Module } from "@/shared";
// import { EventListClient } from "@/components/event/EventListClientPage";
import { ClubEventsClient } from "@/components/club/ClubEventsClient";

export const metadata: Metadata = {
  title: "All Events of my Clubs | PickleHub",
  description: "View all the leagues and events available of all joined clubs.",
};
type Params = EmptyObject; // Empty - no params in URL
type SearchParams = {
  intent?: string;
  clubs?: string;
};

export default async function MyClubsEventListPage({
  searchParams,
}: PageProps<Params, SearchParams>) {
  // await the searchParams (a Promise) and extract intent
  const resolvedSearchParams = await searchParams;
  const intent = resolvedSearchParams?.intent;
  const clubIds = resolvedSearchParams?.clubs?.split(",").map(Number) ?? [];

  // 🎯 Determine mode from query param
  const isJoinMode = intent === "join";

  // build filters:
  const filters: EventListFilters = {
    type: EventFilterType.ALL, // events + leagues
    status: EventFilterStatus.UPCOMING, // upcoming + past
    page: "1", // ✅ "Give me page NUMBER 1"
    pageSize: "20", // ✅ "20 items per page"
    includeUserParticipation: false,
  };

  // ✅ Server Component - fetch data directly and convert snake case to camel case
  const {
    results: events,
    count,
    next,
    previous,
  } = await getMyClubsEvents(clubIds, filters);

  const ShowHeader = () => {
    const imageUrl =
      "https://res.cloudinary.com/dvjri35p2/image/upload/v1768917298/default_Event_g0c5xy.jpg";
    return (
      <div className="container mx-auto relative p-0 ">
        <div
          className="clubList-Header"
          style={{
            backgroundImage: `url("${imageUrl}")`,
          }}
        ></div>
        <h1 className="clubList-Header-text">
          {`${isJoinMode ? "Select an event to join" : "Browse all Events of your clubs"}`}
        </h1>
        <div className="clubList-search"></div>
      </div>
    );
  };
  return (
    <Module type="default">
      <div className="page__content">
        <ShowHeader />
        <ClubEventsClient
          events={events}
          joinMode={isJoinMode}
          gridLimit={false}
          cardMode={EventCardModes.MY_CLUB_EVENTS}
          showHeader={false}
          showActions={true}
        />
      </div>
    </Module>
  );
}
