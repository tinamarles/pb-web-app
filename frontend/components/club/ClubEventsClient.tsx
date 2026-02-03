'use client';
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Event, MemberUser } from "@/lib/definitions";
import { Button} from "@/ui";
import { EmptyState } from "../EmptyState";
import { useAuth } from "@/providers/AuthUserProvider";
import { EventCard } from "../event/EventCard";
import { EventAction, EventActionType, EventCardModes, EventCardModeType } from "@/lib/constants";
import { toast } from "sonner";
/**
 * This component is used by
 * - Club Details - Event Tab: app/club/[clubId]/events
 * - Dashboard - Club Events: app/(sidebarLayout)/dashboard/events
 * - Dashboard - Club Leagues: app/(sidebarLayout)/dashboard/leagues
 * - Resources > Events & Leagues: app/event/list
 */
interface ClubEventsClientProps {
    events: Event[];
    joinMode: boolean;
    gridLimit?: boolean;
    cardMode?: EventCardModeType;
    showHeader?: boolean;
    showActions?: boolean;
}

export function ClubEventsClient({ 
  events, 
  joinMode, 
  gridLimit,
  cardMode = EventCardModes.CLUB_EVENTS,
  showHeader = false,
  showActions = true }: ClubEventsClientProps) {

  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const { user } = useAuth();

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
            console.log('ClubEventsClient: VIEW_DETAILS for event:', event.name)
            const url = joinMode
                ? `/event/${event.id}/?intent=join`
                : `/event/${event.id}`;
                // If user is not logged in, needs to login
                // Middleware automatically handles this but user should get a notification as well
                if (!user) {
                  toast.info("You need to be logged in to view Event Details!");
                }
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
  // FUNCTIONS & COMPONENTS
  // ========================================
  const EventListActions = () => {

    return (
      <div className="flex justify-between items-center border-b border-outline-variant">
        <div className="flex flex-1">
          <p className="body-md text-info">
            Click a card to view sessions and more Information about the activity.
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
  // ========================================
  // Event List: Lists Events and Leagues
  // ========================================
  function EventList() {

    return (
      <div className={`clubList-container ${gridVariant}`}>
      
          {events.map((event) => (
              
              <EventCard
                  key={event.id}
                  event={event}
                  mode={cardMode}
                  variant={cardVariant}
                  onAction={handleEventAction}
              />
          ))}
      </div>
    );
  }
  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="container p-0 mx-auto">
      {showHeader && 
        <EventListHeader />
      }
      {showActions && 
        <EventListActions />
      }
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
 