import { Metadata } from "next";
import { getClubs } from "@/lib/actions";
import { PageProps, EmptyObject, ClubListFilters } from "@/lib/definitions";
import { ModuleClientOnly as Module } from "@/shared";
import { ClubListClient } from "@/components/club/ClubListClientPage";

export const metadata: Metadata = {
  title: "Club List | PickleHub",
  description: "View all the clubs available.",
};
type Params = EmptyObject; // Empty - no params in URL
type SearchParams = { intent?: string };

export default async function ClubListPage({
  searchParams,
}: PageProps<Params, SearchParams>) {
  // await the searchParams (a Promise) and extract intent
  const resolvedSearchParams = await searchParams;
  const intent = resolvedSearchParams?.intent;

  // 🎯 Determine mode from query param
  const isJoinMode = intent === "join";

  // build filters:
  const filters: ClubListFilters = {
    // page, pageSize, search
    page: "1", // ✅ "Give me page NUMBER 1"
    pageSize: "20", // ✅ "20 items per page"
    search: "",
  };
  const requireAuth = false;
  console.log("club/list: calling getClubs with filters:", filters);

  // ✅ Server Component - fetch data directly and convert snake case to camel case
  const {
    results: clubs,
    count,
    next,
    previous,
  } = await getClubs(filters, requireAuth);

  return (
    <Module type="profile">
      <div className="page__content">
        <ClubListClient clubs={clubs} isJoinMode={isJoinMode} />
      </div>
    </Module>
  );
}
