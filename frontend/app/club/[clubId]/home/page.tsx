import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";

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
  const resolvedSearchParams = await searchParams;
  const intent = resolvedSearchParams?.intent;

  console.log("Club Home Page - clubId: ", clubId);
  console.log("Club Home Page - intent: ", intent);
  console.log("Club Home Page - searchParams: ", searchParams);
  return <h1>Club Home Page for Club: {clubId}</h1>;
}
