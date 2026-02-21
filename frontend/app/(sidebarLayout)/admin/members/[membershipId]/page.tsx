import { PageProps } from "@/lib/definitions";
import { Metadata } from "next";
import { AdminMemberDetailsPage } from "@/components/admin/AdminMemberDetailsPage";

export const metadata: Metadata = {
  title: "Member Details | Admin | PickleHub",
  description: "View and manage member details.",
};

type Params = { membershipId: string };

export default async function AdminMembersDetailsPage({
  params,
}: PageProps<Params>) {
  const { membershipId } = await params;

  return <AdminMemberDetailsPage membershipId={membershipId} />;
}
