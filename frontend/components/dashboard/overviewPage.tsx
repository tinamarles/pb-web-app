"use client";
import { EmptyState } from "@/components";
import { useRouter } from "next/navigation";
import { MembershipStatusBadge } from "@/components";
import { ExpiryDate, PeriodDate, Button, DateDisplay } from "@/ui";
import { isDateToday, isRegistrationOpen } from "@/lib/dateUtils";
import { useDashboard } from "@/providers/DashboardProvider";
import { useAuth } from "@/providers/AuthUserProvider";
import { useState, useEffect, useMemo } from "react";
import {
  NotificationType,
  EventCardModes,
  EventAction,
  EventActionType,
} from "@/lib/constants";
import { PendingInvitations } from "./PendingInvitations";
import { Notification, Announcement, Event, EventCardType } from "@/lib/definitions";
import { getClubEventsClient } from "@/lib/clientActions";
import { EventListFilters } from "@/lib/definitions";
import {
  EventFilterType,
  EventFilterStatus,
  SessionAction,
  SessionActionType,
} from "@/lib/constants";
import { SessionCard, SessionCardProps } from "../event/SessionCard";
import { EventCarousel } from "../event/EventCarousel";
import { getTodayISO } from "@/lib/dateUtils";

import Image from "next/image";
import { EventCard } from "../event/EventCard";
import { transformEventsForEventCard } from "@/lib/activityUtils";

export function OverviewPage() {
  // ========================================
  // STATE & DATA
  // ========================================
  const { notifications, markNotificationAsRead } = useAuth();
  const { currentMembership, memberships } = useDashboard();
  const [events, setEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const notificationsList = notifications.filter(
    (item): item is Notification & { feedType: "notification" } =>
      item.feedType === "notification"
  );

  const announcementsList = notifications.filter(
    (item): item is Announcement & { feedType: "announcement" } =>
      item.feedType === "announcement"
  );

  // ✅ NOW filter without ANY type errors!
  const eventInvitations = notificationsList.filter(
    (n) => n.notificationType === NotificationType.EVENT_INVITATION && !n.isRead
  );
  const hasInvitations = eventInvitations.length > 0;

  const clubAnnouncements = announcementsList.filter(
    (n) =>
      n.notificationType === NotificationType.CLUB_ANNOUNCEMENT &&
      n.club?.id === currentMembership?.club.id &&
      n.isPinned
    // No isRead needed - announcements don't have it!
  );

  const hasAnnouncements = clubAnnouncements.length > 0;

  const clubIds = memberships.map(m => m.club.id);

  useEffect(() => {
    async function fetchData() {
      // ✅ GUARD CLAUSE: Exit early if no data yet!
      if (!currentMembership?.club.id) {
        setLoading(false);
        return; // ← Exit early, safe!
      }

      try {
        // Returns PaginatedResponse<League>
        // build filters
        const filters: EventListFilters = {
          type: EventFilterType.ALL,
          status: EventFilterStatus.UPCOMING,
          page: "1",
          pageSize: "10",
          includeUserParticipation: true,
        };
        const response = await getClubEventsClient(
          currentMembership.club.id, // No error!
          filters
        );

        setEvents(response.results); // ← Extract results array
        setTotalCount(response.count); // ← Total count from pagination
        console.log("Results: ", response.results);
      } catch (error) {
        // Error was thrown! Parse the error message
        if (error instanceof Error && error.message.startsWith("[401]")) {
          // redirect
          router.push("/login");
        } else {
          // other error
          console.error("Failed to fetch:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentMembership?.club.id, router]); // Empty array = fetch once on mount

  // Handle states...
  if (loading) return <div>Loading...</div>;
  if (!currentMembership) return <div>No club selected</div>;

  const hasUpcomingEvents = events.length > 0;

  console.log('Current Membership registration open date: ', currentMembership.type.registrationOpenDate);
  // TODO:
  // - get club statistics for user

  const todaysEvents = events.filter(
    (ev) =>
      isDateToday(ev.nextSession?.date) &&
      (ev.userIsParticipant || ev.userIsCaptain)
  );
  const hasTodaysEvents = todaysEvents.length > 0;

  // ========================================
  // EVENT HANDLERS
  // ========================================
  const openCreateEventModal = () => {
    console.log("Create Event clicked!");
  };

  const handleRegister = () => {
    console.log("Register Button clicked");
  };

  const handleEventAction = (action: EventActionType, event: EventCardType) => {
    switch (action) {
      case EventAction.VIEW_DETAILS:
        router.push(`/event/${event.eventInfo.id}`);
        break;
      case EventAction.MANAGE_ATTENDEES:
        // for captains: to go deal with this session's attendees
        alert(
          `User wants to manage attendees for: ${event.eventInfo.name} and date: ${event.sessionInfo?.date}`
        );
      // router.push(`admin/events/${event.id}/${event.nextSession?.id}/attendees`)
    }
  };
  const handleTodaysEventAction = (
    action: SessionActionType,
    sessionId: number
  ) => {
    switch (action) {
      case SessionAction.CHECK_IN:
        // this JOIN function is for the user to join an Event session
        alert("Captain wants to check-in this Event Session");
        break;
      case SessionAction.CANCEL:
        // this JOIN function is for the user to join an Event session
        alert("User wants to Cancel this Event/League Session");
        break;
      case SessionAction.MANAGE_ATTENDEES:
        alert("Captain wants to go to manage the attendees");
        break;
      case SessionAction.MY_MATCHES:
        alert("User wants to see his matches");
        break;
    }
  };

  // ========================================
  // Components and functions
  // ========================================

  const ClubAnnouncement = () => {
    //const pinnedClubAnnouncement = clubAnnouncements.filter(
    //  (n) => n.club?.id === currentMembership.club.id && n.isPinned
    //)
    return (
      <div className="flex flex-col gap-sm bg-surface-container-lowest rounded-md p-sm">
        <p className="title-sm emphasized text-on-surface">
          {clubAnnouncements[0]?.title}
        </p>
        {clubAnnouncements[0].imageUrl && (
          <div className="image-container">
            <Image
              src={clubAnnouncements[0].imageUrl}
              alt="Club Announcement Banner"
              fill
              sizes="100vw "
              className="object-cover"
            />
          </div>
        )}
        <p className="body-sm text-on-surface-variant">
          {clubAnnouncements[0]?.content}
        </p>
        <p className="label-sm text-on-surface-variant">
          Posted on:{" "}
          {new Date(clubAnnouncements[0]!.createdAt).toLocaleDateString()}
        </p>
        <Button
          variant="highlighted"
          iconPosition="right"
          size="sm"
          label="Read More"
          icon="chevronright"
          className="w-fit pl-0"
        />
      </div>
    );
  };

  const RenderTodaysSessionCards = () => {
    return todaysEvents.map((todaySession) => {
      if (!todaySession.nextSession) {
        return;
      }
      return (
        <SessionCard
          key={todaySession.nextSession?.id}
          isEvent={todaySession.isEvent}
          variant="today"
          session={todaySession.nextSession}
          userIsParticipant={todaySession.userIsParticipant || true}
          userIsCaptain={todaySession.userIsCaptain}
          eventName={todaySession.name}
          onAction={handleTodaysEventAction}
        />
      );
    });
  };

  const RenderUpcomingEventCards = () => {
    // transform events to EventCardType
    const transformedEvents = useMemo(() =>
            transformEventsForEventCard(events, EventCardModes.DASHBOARD_UPCOMING)
          , [events]);
    return <EventCarousel events={transformedEvents} onAction={handleEventAction} />
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <>
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row bg-secondary">
        {/* Left column: Todays activities */}
        <div className="flex flex-col flex-1 flex-start p-md">
          <p className="title-md emphasized text-on-secondary mb-md">
            My Activities Today -{" "}
            <DateDisplay date={getTodayISO()} format="weekday-short-noYear" />
          </p>
          {hasTodaysEvents ? (
            <div className="@container/card flex flex-col gap-sm">
              <RenderTodaysSessionCards />
            </div>
          ) : (
            <EmptyState
              icon="Calendar"
              title="No events today"
              description="Check back later or create your own event"
              actionLabel="Create Event"
              onAction={openCreateEventModal}
              className="text-on-surface bg-surface-container-lowest rounded-md"
            />
          )}
        </div>
        {/* Right Column */}
        <div className="flex flex-col flex-1 flex-start p-md gap-md">
          {/* Club Announcement */}
          <>
            <p className="title-md emphasized text-on-secondary">
              Latest Club Announcement
            </p>
            {hasAnnouncements ? (
              <ClubAnnouncement />
            ) : (
              <EmptyState
                icon="Announcements"
                title="No Announcements at present"
                description="Check back later"
                className="text-on-surface bg-surface-container-lowest rounded-md"
              />
            )}
          </>
          {/* Membership Information */}
          {currentMembership && (
            <div className="flex flex-col gap-sm bg-surface-container-lowest rounded-md p-sm">
              {/* Membership Header */}
              <div className="flex items-center justify-between gap-sm ">
                <div className="flex flex-col sm:flex-row items-center gap-sm ">
                  <p className="title-md emphasized text-on-surface">
                    My Membership
                  </p>
                  <MembershipStatusBadge status={currentMembership.status} />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-sm ">
                  <p className="title-sm emphasized text-on-surface-variant">
                    Expiry Date:
                  </p>
                  <ExpiryDate
                    date={currentMembership.registrationEndDate}
                    format="short"
                    nullText="Lifetime"
                    warningDays={30}
                    className="title-sm emphasized"
                  />
                </div>
              </div>
              <p className="title-sm emphasized">
                Registration Renewal Period:
              </p>
              <div className="flex gap-md items-center">
                <PeriodDate
                  date={currentMembership.type.registrationOpenDate}
                  openDate={currentMembership.type.registrationOpenDate}
                  closeDate={currentMembership.type.registrationCloseDate}
                  format="short"
                  warningDays={30}
                  className="body-sm emphasized"
                />
                <span className="body-sm text-info">to</span>
                <PeriodDate
                  date={currentMembership.type.registrationCloseDate}
                  openDate={currentMembership.type.registrationOpenDate}
                  closeDate={currentMembership.type.registrationCloseDate}
                  format="short"
                  warningDays={30}
                  className="body-sm emphasized"
                />
              </div>
              {/* Membership Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="filled"
                  size="sm"
                  disabled={
                    !isRegistrationOpen(
                      currentMembership.type.registrationOpenDate,
                      currentMembership.type.registrationCloseDate
                    )
                  }
                  onClick={() => handleRegister()}
                  label="Register"
                  icon="register"
                />
                {(currentMembership.canManageMembers ||
                  currentMembership.canManageClub) && (
                  <Button
                    variant="outlined"
                    size="sm"
                    label="Membership"
                    icon="edit"
                    href={`/admin/members/${currentMembership.id}`}
                  />
                )}
                <Button
                  variant="outlined"
                  size="sm"
                  disabled={true}
                  label="Subscriptions"
                  icon="subscriptions"
                />
              </div>
            </div>
          )}
          {/* Club Stats */}
          <div className="">
            <p className="title-md emphasized text-on-secondary mb-md">
              My Club Statistics
            </p>
            <EmptyState
              icon="Performance"
              title="Not available at the moment"
              description="Check back later"
              className="text-on-surface bg-surface-container-lowest rounded-md"
            />
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-md p-md px-0">
        <Button 
          variant="default" 
          size="sm" 
          icon="events" 
          label="All Events" 
          // href="/event/my-clubs"
          href={`/event/my-clubs?clubs=${clubIds.join(',')}`}
        />
        <Button
          variant="default"
          size="sm"
          icon="calendar"
          label="My Activities"
          href="/event/my-activities"
        />
        <Button variant="default" size="sm" icon="add" label="Event" />
      </div>
      {/* Pending Invitations */}
      <div className="bg-surface-container">
        {/* Content container */}
        <div className="flex flex-col p-md gap-sm">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="title-md emphasized text-on-surface">
              Pending Invitations
            </span>
            {notifications.length > 3 && (
              <Button
                variant="highlighted"
                size="sm"
                href="/notifications"
                label={`View All (${notifications.length})`}
              />
            )}
          </div>
          {/* List container */}
          <div className="">
            {hasInvitations ? (
              <PendingInvitations
                notifications={eventInvitations}
                onNotificationClick={(id) => markNotificationAsRead(id)}
              />
            ) : (
              <EmptyState
                icon="calendar"
                title="No Invitations at present"
                description="You currently do not have any pending invitations!"
                className="text-on-surface bg-surface-container-lowest rounded-md"
              />
            )}
          </div>
        </div>
      </div>
      {/* Upcoming Events */}
      {hasUpcomingEvents ? (
        <div className="club-details-bottomSection p-0 pt-md">
          <RenderUpcomingEventCards />
        </div>
      ) : (
        <EmptyState
          icon="events"
          title="No upcoming events yet"
          description="Check back later!"
          className="text-on-surface bg-surface-container-lowest rounded-md"
        />
      )}
    </>
  );
}
