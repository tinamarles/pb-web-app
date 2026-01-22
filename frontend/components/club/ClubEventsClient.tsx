'use client';
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Event, MemberUser } from "@/lib/definitions";
import { Button} from "@/ui";
import { EmptyState } from "../EmptyState";
import { EventCard } from "../event/EventCard";
import { EventAction, EventActionType, EventCardModes } from "@/lib/constants";

interface ClubEventsClientProps {
    events: Event[];
    joinMode: boolean;
    gridLimit?: boolean;
}

export function ClubEventsClient({ events, joinMode, gridLimit}: ClubEventsClientProps) {

  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const eventsAvailable = events.length > 0;
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  const isJoinMode = intent === "join";

  const cardVariant = gridLimit ? 'grid-sidebar' : 'grid-display';
  const gridVariant = gridLimit ? 'grid-3-card' : 'grid-3 xl:grid-cols-4'

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleEventAction = (
    action: EventActionType, 
    event: Event,
    e?: React.MouseEvent  // ✅ Accept but don't need to use!
  ) => {
    // ✅ e.stopPropagation() already called INSIDE EventCard!
    // No need to call it here - the event already stopped propagating!
    
    switch (action) {
        case EventAction.VIEW_DETAILS:
            const url = isJoinMode
                ? `/event/${event.id}/?intent=join`
                : `/event/${event.id}`;
                router.push(url);
            break;
        case EventAction.CHECK_IN:
            alert("Check In Clicked");
            break;
        case EventAction.MANAGE_ATTENDEES:
            alert("Manage Attendees Clicked");
            break;
        case EventAction.CANCEL:
            alert("Cancel Clicked");
            break;
        case EventAction.MESSAGE_HOST:
            alert("Message Host Clicked");
            break;
        case EventAction.JOIN:
            alert("Join Clicked");
            break;
    }
  };

  // ========================================
  // Event List: Lists Events and Leagues
  // ========================================
  function EventList() {

    return (
        <>
            {/* Action buttons */}
            <div className="flex justify-between items-center border-b border-outline-variant">
                <div className="flex flex-1">
                    <p className="body-md text-info">
                    Click a card to view more Information about the activity.
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

            {/* Show Event Cards */}
            <div className={`clubList-container ${gridVariant}`}>
            
                {events.map((event) => (
                    
                    <EventCard
                        key={event.id}
                        event={event}
                        mode={EventCardModes.CLUB_EVENTS}
                        variant={cardVariant}
                        onAction={handleEventAction}
                    />
                ))}
            </div>
        </>
    );
  }
  // ========================================
  // RENDER
  // ========================================
  return (
    <>
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
    </>
  );
}