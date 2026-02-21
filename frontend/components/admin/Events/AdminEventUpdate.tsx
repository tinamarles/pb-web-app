"use client";
import { PlaceholderPage } from "@/components";

type AdminEventUpdatePageProps = {
  eventId: string;
};

export function AdminEventUpdatePage({ eventId }: AdminEventUpdatePageProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">
        Admin Update Event/League - ID: {eventId}
      </h1>
      <PlaceholderPage />
    </>
  );
}
