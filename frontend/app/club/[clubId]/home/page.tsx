import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { getClubHome } from '@/lib/actions';
import { ClubHome } from "@/lib/definitions";

export const metadata: Metadata = {
  title: "Club Details | Club | PickleHub",
  description: "View the details of the selected club.",
};

type Params = { clubId: string };
type SearchParams = { intent?: string };

export default async function ClubHomePage({
  params,
  searchParams
}: PageProps<Params, SearchParams>) {
  const { clubId } = await params;
  const club: ClubHome = await getClubHome(clubId);

  console.log("Club Home Page - clubHome data: ", club);  

  return (
    <div className="flex flex-col gap-md">
      <h2 className="subheading-lg text-secondary">HOME TAB for club: {club.club.name}</h2>
      <p className="mt-2 title-lg text-on-surface">
        Announcement: {club.latestAnnouncement?.title}
      </p>
      <p className="title-lg text-secondary">
        Event: {club.nextEvent?.name} . {club.nextEvent?.nextOccurrence?.date}
      </p>
      <p className="title-md text-on-surface">
        Top Members: showing {club.topMembers.length}
      </p>
    </div>
  )
}
