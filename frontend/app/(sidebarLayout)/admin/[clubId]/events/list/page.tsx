import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { getAdminClubEvents } from "@/lib/actions";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/apiErrors";
import { handleApiError } from "@/lib/errorHandling";
import { EmptyObject } from "@/lib/definitions";
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

  const requireAuth = true;

  try {
    const events = await getAdminClubEvents(
      clubId,
      requireAuth,
    );
    return <AdminEventsList events={events} />;
  } catch (error) {
    if (isApiError(error)) {
      handleApiError(error, "/dashboard/overview");
    }
    redirect("/dashboard/overview?error=unknown");
  }
}
