// not used
import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { ClubDetailsClientPage } from "@/components/club/ClubDetailsClientPage";


export const metadata: Metadata = {
  title: "Club Details | Club | PickleHub",
  description: "View the details of the selected club.",
};

type Params = { clubId: string };

export default async function ClubDetailsPage({
  params,
}: PageProps<Params>) {
  const { clubId } = await params;

  return <ClubDetailsClientPage clubId={clubId} />;
}
