import { Metadata } from "next";
import { getEvents } from "@/lib/actions";
import { PageProps, EmptyObject, EventListFilters } from "@/lib/definitions";
import { EventFilterType, EventFilterStatus } from "@/lib/constants";
import { ModuleClientOnly as Module } from "@/shared";
import { EventListClient } from "@/components/event/EventListClientPage";

export const metadata: Metadata = {
  title: "League & Events List | PickleHub",
  description: "View all the leagues and clubs available.",
};
type Params = EmptyObject; // Empty - no params in URL
type SearchParams = { intent?: string };

export default async function EventListPage({
  searchParams,
}: PageProps<Params, SearchParams>) {
  // await the searchParams (a Promise) and extract intent
  const resolvedSearchParams = await searchParams;
  const intent = resolvedSearchParams?.intent;

  // 🎯 Determine mode from query param
  const isJoinMode = intent === "join";

  // build filters: 
  const filters: EventListFilters = {
    type: EventFilterType.ALL, // events + leagues
    status: EventFilterStatus.ALL, // upcoming + past
    page: '1',      // ✅ "Give me page NUMBER 1"
    pageSize: '20', // ✅ "20 items per page"
    includeUserParticipation: false
  }
  const requireAuth = false;

  // ✅ Server Component - fetch data directly and convert snake case to camel case
  const { results: events, count, next, previous } = await getEvents(filters, requireAuth);
  
  return (
    <Module type="default">
      <div className="page__content">
        <EventListClient events={events} isJoinMode={isJoinMode} />
      </div>
    </Module>
  );
}
