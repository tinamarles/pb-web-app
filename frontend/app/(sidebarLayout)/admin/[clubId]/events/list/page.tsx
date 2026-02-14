import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { getClubEvents } from "@/lib/actions";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/apiErrors";
import { handleApiError } from "@/lib/errorHandling";
import { EventListFilters, EmptyObject } from "@/lib/definitions";
import { EventFilterType, EventFilterStatus } from "@/lib/constants";
import { AdminEventsList } from "@/components/admin/Events/AdminEventsList";

export const metadata: Metadata = {
  title: "Club Details | Club | PickleHub",
  description: "View the details of the selected club.",
};

type Params = { clubId: string };
type SearchParams = EmptyObject;

export default async function AdminEventsPage({
  params,
  searchParams,
}: PageProps<Params, SearchParams>) {
  const { clubId } = await params;

  // build filters:
  const filters: EventListFilters = {
    type: EventFilterType.ALL, // events + leagues
    status: EventFilterStatus.UPCOMING, // upcoming + past
    page: "1", // ✅ "Give me page NUMBER 1"
    pageSize: "20", // ✅ "20 items per page"
    includeUserParticipation: true,
  };
  const requireAuth = true;
  const requireAdmin = true;

  try {
    const { results } = await getClubEvents(clubId, filters, requireAuth, requireAdmin);
    return <AdminEventsList events={results} />;
  } catch (error) {
    if (isApiError(error)) {
      handleApiError(error, '/dashboard/overview');
    }
    redirect('/dashboard/overview?error=unknown');
  }
}
