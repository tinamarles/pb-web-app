"use client";
import { PlaceholderPage } from "@/components";

type AdminEventDetailPageProps = {
  eventId: string;
};

export function AdminEventDetailPage({ eventId }: AdminEventDetailPageProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">
        Admin Event/League Details - ID: {eventId}
      </h1>
      <PlaceholderPage />
    </>
  );
}
