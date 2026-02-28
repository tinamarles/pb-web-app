"use client";
// SUPERCEDED - All pages use ClubEventsClient now!!

// === MODIFICATION LOG ===
// Date: 2026-01-04
// Created by: Assistant
// Purpose: Client component for displaying club list with join mode filtering
// ========================
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { Event, MemberUser } from "@/lib/definitions";
import { Button } from "@/ui";
import { EmptyState } from "../EmptyState";
import { EventCard } from "./EventCard";
import { EventAction, EventActionType, EventCardModes } from "@/lib/constants";
import { toast } from "sonner";

/**
 * This component is used by
 * - app/event/list
 */
interface EventListClientProps {
  events: Event[];
  isJoinMode: boolean;
}

export function EventListClient({ events, isJoinMode }: EventListClientProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const { user } = useAuth();

  // 🎯 Filter clubs the user is a member of
  // const memberships = isMemberUser ? (user as MemberUser).clubMemberships : [];

  const eventsAvailable = events.length > 0;

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleEventAction = (action: EventActionType, event: Event) => {
    switch (action) {
      case EventAction.VIEW_DETAILS:
        const url = isJoinMode
          ? `/event/${event.id}/?intent=join`
          : `/event/${event.id}`;
        // If user is not logged in, needs to login
        // Middleware automatically handles this but user should get a notification as well
        if (!user) {
          toast.info("You need to be logged in to view Event Details!");
        }
        router.push(url);
        break;
    }
  };

  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================
  const EventListHeader = () => {
    const imageUrl =
      "https://res.cloudinary.com/dvjri35p2/image/upload/v1768051542/ClubListHeader_awq942.jpg";

    return (
      <div className="container relative p-0 ">
        <div
          className="clubList-Header"
          style={{
            backgroundImage: `url("${imageUrl}")`,
          }}
        ></div>
        <h1 className="clubList-Header-text">
          {`${isJoinMode ? "Select an Activity to join" : "Browse all our Activities"}`}
        </h1>
        <div className="clubList-search"></div>
      </div>
    );
  };

  const EventListActions = () => {
    return (
      <div className="flex justify-between items-center border-b border-outline-variant">
        <div className="flex flex-1">
          <p className="body-md text-info">
            Click a card to view sessions and more Information about the
            activity.
          </p>
        </div>

        <div className="flex gap-md pb-sm justify-end">
          <Button
            variant="default"
            size="sm"
            icon="add"
            label="Create an Event"
          />
        </div>
      </div>
    );
  };

  // ========================================
  // Event List: Lists Events and Leagues
  // ========================================
  function EventList() {
    return (
      <div className="clubList-container grid-3 xl:grid-cols-4">
        {/* {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            mode={EventCardModes.ALL_EVENTS}
            variant="grid-display"
            onAction={handleEventAction}
          />
        ))} */}
      </div>
    );
  }
  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="container p-0 mx-auto">
      <EventListHeader />
      <EventListActions />
      {eventsAvailable ? (
        <EventList />
      ) : (
        <EmptyState
          icon="events"
          title="No Activities to show!"
          description={`${
            isJoinMode
              ? "You are already enrolled in all available activities!"
              : "No activities available yet!"
          }`}
          className="text-on-surface bg-surface-container-lowest rounded-md"
          actionLabel="Create an event"
          actionIcon="add"
          href="/event/create"
        />
      )}
    </div>
  );
}
