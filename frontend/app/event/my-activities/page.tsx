import { Metadata } from "next";
import { getUserActivities } from "@/lib/actions";
import { PageProps, EmptyObject } from "@/lib/definitions";
import { ModuleClientOnly as Module } from "@/shared";
import { MyActivitiesClient } from "@/components/event/MyActivitiesClient";

export const metadata: Metadata = {
  title: "All my activities | PickleHub",
  description: "View your schedule - see all your activities and bookings.",
};
type Params = EmptyObject; // Empty - no params in URL
type SearchParams = EmptyObject;

export default async function MyActivitiesPage({
}: PageProps<Params, SearchParams>) {

  // ✅ Server Component - fetch data directly and convert snake case to camel case
  const { activities } = await getUserActivities();
  
  return (
    <Module type="default">
      <div className="page__content">
        <MyActivitiesClient activities={activities} /> 
      </div>
    </Module>
  );
}
