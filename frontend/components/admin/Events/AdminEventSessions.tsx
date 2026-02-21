"use client";
import { PlaceholderPage } from "@/components";
import { AdminEvent } from "@/lib/definitions";

type AdminEventSessionsPageProps = {
  event: AdminEvent;
};

export function AdminEventSessionsPage({ event }: AdminEventSessionsPageProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">
        Admin Event/League Sessions - {event.name}
      </h1>
      <PlaceholderPage />
    </>
  );
}
