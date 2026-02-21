import { AdminEventSessionsPage } from "@/components/admin/Events/AdminEventSessions";
import { PageProps, EmptyObject, AdminEvent } from "@/lib/definitions";
import { getAdminClubEvent } from "@/lib/actions";
import { Metadata } from "next";
import { isApiError } from "@/lib/apiErrors";
import { handleApiError } from "@/lib/errorHandling";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Event & League Sessions | Admin | PickleHub",
  description: "Manage event and league sessions.",
};

type Params = { clubId: string; eventId: string };
type SearchParams = EmptyObject;

export default async function AdminEventSessions({
  params,
}: PageProps<Params>) {
  const { clubId, eventId } = await params;

  const cache = true;
    try {
      const event: AdminEvent = await getAdminClubEvent(clubId, eventId, cache);
      return <AdminEventSessionsPage event={event} />;
    } catch (error) {
      if (isApiError(error)) {
        handleApiError(error, `/admin/${clubId}/events/list`);
      }
      redirect("/dashboard/overview?error=unknown");
    }

}
