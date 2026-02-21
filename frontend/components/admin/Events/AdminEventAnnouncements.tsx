"use client";
import { PlaceholderPage } from "@/components";

type AdminEventAnnouncementsProps = {
  eventId: string;
};

export function AdminEventAnnouncementsPage({ eventId }: AdminEventAnnouncementsProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">
        Admin Event Announcements - ID: {eventId}
      </h1>
      <PlaceholderPage />
    </>
  );
}
