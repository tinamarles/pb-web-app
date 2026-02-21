import { AdminEventMembersPage } from "@/components/admin/Events/AdminEventMembers";
import { PageProps, EmptyObject, AdminEvent } from "@/lib/definitions";
import { getAdminLeagueParticipants } from "@/lib/actions";
import { Metadata } from "next";
import { isApiError } from "@/lib/apiErrors";
import { handleApiError } from "@/lib/errorHandling";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Event & League Participants | Admin | PickleHub",
  description: "Manage event and league participants.",
};

type Params = { clubId: string; eventId: string };
type SearchParams = EmptyObject;

export default async function AdminEventMembers({ params }: PageProps<Params>) {
  const { clubId, eventId } = await params;

  const cache = true;
  try {
    const participants = await getAdminLeagueParticipants(eventId, cache);
    return <AdminEventMembersPage participants={participants} clubId={clubId} eventId={eventId}/>;
  } catch (error) {
    if (isApiError(error)) {
      handleApiError(error, `/admin/${clubId}/events/list`);
    }
    redirect("/dashboard/overview?error=unknown");
  }
}
