'use client';
import { PlaceholderPage } from "../PlaceholderPage";

type AdminMemberDetailsPageProps = {
  membershipId: string;
};

export function AdminMemberDetailsPage({ membershipId }: AdminMemberDetailsPageProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">
        Admin Member Details - ID: {membershipId}
      </h1>
      <PlaceholderPage />
    </>
  );
}