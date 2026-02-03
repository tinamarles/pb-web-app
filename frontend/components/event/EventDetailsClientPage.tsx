"use client";
import { PlaceholderPage } from "../PlaceholderPage";
import { Event } from "@/lib/definitions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import {
  Badge,
  Button,
  ResponsiveButton,
  RecurringDayIndicator,
  Avatar,
} from "@/ui";
import { EmptyState } from "../EmptyState";
import { EventCard } from "./EventCard";
import { SessionCarousel } from "./SessionCarousel";
import { PlayersModal } from "./PlayersModal";
import {
  EventAction,
  EventActionType,
  EventCardModes,
  SessionActionType,
  SessionAction,
  SkillLevel,
  getSkillLevelBadgeVariant,
  SkillLevelLabels,
} from "@/lib/constants";
import { SessionCard } from "./SessionCard";

type EventDetailsClientPageProps = {
  event: Event;
};

export function EventDetailsClientPage({ event }: EventDetailsClientPageProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);

  const userNextSession = event.userNextSessionId
    ? event.upcomingSessions?.find(
        (session) => session.id === event.userNextSessionId
      )
    : undefined;

  const hasUpcomingSessions = (event.upcomingSessions?.length ?? 0) > 0;

  // Attendance status (integer from backend)

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleEventCardAction = (
    action: EventActionType,
    event: Event,
    e?: React.MouseEvent // ✅ Accept but don't need to use!
  ) => {
    console.log("Nothing to do here");
  };
  // Handlers for Buttons on the Event Details -> Join/Cancel League Participation
  const handleEventAction = (action: EventActionType, eventId: number) => {
    switch (action) {
      case EventAction.JOIN:
        // the JOIN function is here to join a League only ->
        // Events are joined via SessionAction
        alert("User wants to Join the League");
        break;
      case EventAction.CANCEL:
        // the Cancel function is here to cancel participation in a League only ->
        // Events and individual League Sessions are canceled via SessionAction
        alert("User wants to cancel League participation");
        break;
    }
  };

  // Handler for Buttons on the Session Card
  const handleSessionAction = (
    action: SessionActionType,
    sessionId: number
  ) => {
    switch (action) {
      case SessionAction.JOIN:
        // this JOIN function is for the user to join an Event session
        alert("User wants to Join this Event Session");
        break;
      case SessionAction.CANCEL:
        // this JOIN function is for the user to join an Event session
        alert("User wants to Cancel this Event/League Session");
        break;
      case SessionAction.PLAYERS:
        // the PLAYERS function will open a modal to view the participating players of the session
        setIsPlayersModalOpen(true);
        return;
    }
  };

  // ========================================
  // Components and functions
  // ========================================

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="event-details">
      <div className="event-details-topSection">
        <EventCard
          event={event}
          mode={EventCardModes.EVENT_DETAIL}
          onAction={handleEventCardAction}
          variant="detail"
        />
        {/* Show Manage League Button if user is captain only */}
        <div className="flex mt-md gap-sm px-lg justify-between">
          <h2 className="headline-md text-secondary">About {event.name}</h2>
          {event.userIsCaptain && (
            <ResponsiveButton
              mobile={{ size: "sm", label: "Manage League", icon: "leagues" }}
              desktop={{ size: "sm", label: "Manage League", icon: "leagues" }}
              variant="default"
              href={`/admin/events/${event.id}`}
            />
          )}
        </div>
        {/* Show Event Info & Leave/Join League Buttons and Next Session */}
        <div className="flex flex-col md:flex-row gap-md items-top">
          {/* <MarkdownContent content={club.longDescription || ''} /> */}
          <div className="flex flex-col mt-md gap-sm pl-lg flex-1">
            <p className="body-sm sm:body-md text-on-surface-variant pb-md mb-md border-b border-outline-variant">
              {event.description ||
                "No additional details provided for this event."}
            </p>
            <div className="flex flex-col gap-sm pb-sm">
              <p className="title-md emphasized text-on-surface">
                Skill Level: {` `}
                <Badge
                  variant={getSkillLevelBadgeVariant(
                    event.minimumSkillLevel ?? SkillLevel.OPEN
                  )} // ✅ Default BEFORE function
                  label={
                    event.minimumSkillLevel
                      ? SkillLevelLabels[event.minimumSkillLevel]
                      : "All Levels"
                  }
                  className="w-fit py-md rounded-sm"
                  icon="skill"
                />
              </p>
              {/* Recurring Days Bar */}
              {event.isRecurring && (
                <div className="flex items-center gap-sm">
                  <p className="body-lg emphasized text-on-surface">
                    Sessions:
                  </p>
                  <RecurringDayIndicator
                    days={event.recurringDays}
                    variant="responsive"
                    className="sm:gap-lg sm:px-sm lg:gap-xl lg:px-md"
                  />
                </div>
              )}
              <div className="grid grid-cols-2">
                <div className="flex flex-col">
                  <p className="title-md emphasized text-on-surface mb-sm">
                    Captain/Host:
                  </p>
                  <div className="flex items-center text-on-surface-variant gap-sm">
                    <Avatar
                      size="sm"
                      src={event.captainInfo.profilePictureUrl}
                      name={event.captainInfo.fullName}
                    />
                    {event.captainInfo.fullName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons & Next Session */}
          <div className="flex flex-col mt-md gap-sm pr-lg pb-lg lg:items-end">
            {/* Non-captain participant sees Cancel button (leagues only) */}
            {!event.userIsCaptain &&
              event.userIsParticipant &&
              !event.isEvent && (
                <Button
                  variant="error"
                  size="md"
                  label="Leave this League"
                  onClick={() =>
                    handleEventAction(EventAction.CANCEL, event.id)
                  }
                />
              )}

            {/* Non-captain non-participant sees Join button (leagues only) */}
            {!event.userIsCaptain &&
              !event.userIsParticipant &&
              !event.isEvent && (
                <Button
                  variant="filled"
                  size="md"
                  label="Join this League"
                  onClick={() => handleEventAction(EventAction.JOIN, event.id)}
                />
              )}
            {event.isRecurring ? (
              <div className="event-card bg-surface-container-highest p-md w-fit">
                <h3 className="title-md text-primary mb-sm">
                  {" "}
                  Your Next Session
                </h3>
                {userNextSession ? (
                  <SessionCard
                    session={userNextSession}
                    isEvent={event.isEvent}
                    userIsParticipant={true}
                    onAction={handleSessionAction}
                  />
                ) : (
                  <p className="empty-sessions body-sm text-on-surface">
                    You have not enrolled in any sessions!
                  </p>
                )}
              </div>
            ) : (
              <div className="event-card bg-surface-container-highest p-md">
                <h3 className="title-md text-primary mb-sm">
                  {" "}
                  One Time Session
                </h3>
                {event.oneTimeSessionInfo ? (
                  <SessionCard
                    session={event.oneTimeSessionInfo}
                    isEvent={event.isEvent}
                    userIsParticipant={event.userIsParticipant || false}
                    onAction={handleSessionAction}
                  />
                ) : (
                  <p className="body-sm text-on-surface">
                    No session information available!
                  </p>
                )}
              </div>
            )}
            {/* Players Modal */}
            {userNextSession && (
              <PlayersModal
                sessionId={userNextSession.id}
                isOpen={isPlayersModalOpen}
                onClose={() => setIsPlayersModalOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
      {/* Show Session Carousel for recurring Events with upcoming sessions */}
      {event.isRecurring &&
        (hasUpcomingSessions ? (
          <div className="club-details-bottomSection pt-md">
            {/* SessionCarousel goes here */}
            <SessionCarousel
              sessions={event.upcomingSessions!}
              isEvent={event.isEvent}
              userIsParticipant={event.userIsParticipant || false}
              onAction={handleSessionAction} // ✅ Same handler as SessionCard!
            />
          </div>
        ) : (
          <div className="club-details-bottomSection pt-md pl-0">
            <h2 className="headline-md text-on-surface">
              No further Sessions scheduled
            </h2>
          </div>
        ))}
    </div>
  );
}
