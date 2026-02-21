"use client";
import { PlaceholderPage } from "@/components";

type AdminEventScheduleProps = {
  eventId: string;
};

export function AdminEventSchedulePage({ eventId }: AdminEventScheduleProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">
        Admin Event Schedule - ID: {eventId}
      </h1>
      <PlaceholderPage />
    </>
  );
}
