"use client";
import { PlaceholderPage } from "../PlaceholderPage";

type EventDetailsClientPageProps = {
  eventId: string;
};

export function EventDetailsClientPage({ eventId }: EventDetailsClientPageProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">Event Details - ID: {eventId}</h1>
      <PlaceholderPage />
    </>
  );
}
