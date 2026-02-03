// components/event/EventCarousel.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/lib/definitions";
import { EventCard } from "./EventCard";
import { EventAction, EventActionType, EventCardModes } from "@/lib/constants";

export interface EventCarouselProps {
  events: Event[];  // Array of upcoming sessions
  onAction: (
      action: EventActionType,
      event: Event,
      e?: React.MouseEvent
    ) => void;
}

/**
 * EventCarousel Component
 * 
 * Horizontal scrolling carousel of Event cards.
 * 
 * **Usage:**
 * - Dashboard Overview page shows Upcoming events
 * - User scrolls horizontally through upcoming sessions
 * - Can join/cancel individual sessions (for events)
 * - Can view players attending each session
 * 
 * **Data Source:**
 * - events[] from LeagueSerializer
 * 
 * **Actions:**
 * - All actions handled by parent 
 */
export function EventCarousel({
  events,
  onAction,
}: EventCarouselProps) {

  // State for Players modal
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const router = useRouter();

  // Handle session actions (wrap to intercept 'players' action for modal)
  const handleEventAction = (action: EventActionType, event: Event) => {
    
    onAction(action, event);
  }

  return (
    <>
      <div className="sessions-carousel-container p-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-md">
          <h2 className="title-lg text-on-surface">Upcoming Events</h2>
          <span className="body-sm text-on-surface-variant">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        {/* Horizontal Scroll Container */}
        <div className="sessions-carousel">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              variant="grid-sidebar"
              mode={EventCardModes.DASHBOARD_UPCOMING}
              onAction={handleEventAction}
            />
          ))}
        </div>
      </div>
    </>
  );
}