import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { getClubHome } from '@/lib/actions';
import { ClubDetailHome } from "@/lib/definitions";

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
  const club: ClubDetailHome = await getClubHome(clubId);

  console.log("Club Home Page - clubHome data: ", club);  

  return <h1>Club Home Page for Club: {club.shortName}</h1>;
}
