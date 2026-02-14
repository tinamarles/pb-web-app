// lib/activityUtils.ts
// =====================================================
// ACTIVITY AND EVENT TRANSFORMATION UTILITIES
// =====================================================
// Transforms ActivityItem (EventActivity | BookingActivity) 
// into EventCard for UI rendering
//
// Transforms Event into EventCard for UI rendering

import type { 
  ActivityItem, 
  EventActivity, 
  BookingActivity, 
  EventCardType,
  EventCardSession,
  Event,
  Tag
} from '@/lib/definitions';
import { 
  ActivityType,
  BookingTypeLabels,
  SkillLevelLabels,
  EventCardModes,
  EventCardModeType,
  getSkillLevelBadgeVariant,
  getSkillLevelLabel,
  SkillLevel,
  DayOfWeekValue
} from '@/lib/constants';
import { is } from 'date-fns/locale';

/**
 * Type guard: Check if activity is a SessionActivity (event)
 */
export function isEventActivity(activity: ActivityItem): activity is EventActivity {
  return activity.type === ActivityType.EVENT;
}

/**
 * Type guard: Check if activity is a BookingActivity
 */
export function isBookingActivity(activity: ActivityItem): activity is BookingActivity {
  return activity.type === ActivityType.BOOKING;
}

/** =====================================
* Conversion 1: type Event -> EventCardType (eg needs to be used by frontend/components/club/ClubEventsClient.tsx)
* Usage:
* 
* const transformedEvents = useMemo(() =>
*   events.map(transformEventToEventCard)
* , [events]);
* ```
* ===================================== */
export function transformEventToEventCard(event: Event, cardMode: EventCardModeType): EventCardType {
 
  const avatarUrl =
        cardMode === EventCardModes.ALL_EVENTS ||
        cardMode === EventCardModes.MY_CLUB_EVENTS
          ? event.clubInfo.logoUrl
          : event.captainInfo.profilePictureUrl || '';
  
  const avatarName =
        cardMode === EventCardModes.ALL_EVENTS ||
        cardMode === EventCardModes.MY_CLUB_EVENTS
          ? event.clubInfo.name
          : event.captainInfo.fullName || '';
          
  const skillTag: Tag = {
    name: getSkillLevelLabel(event.minimumSkillLevel ?? SkillLevel.OPEN),
    color: getSkillLevelBadgeVariant(
      event.minimumSkillLevel ?? SkillLevel.OPEN
    ),
  }; 
  
  // Session data
  const eventSession = event.nextSession ? event.nextSession : event.oneTimeSessionInfo;

  return {
    type: ActivityType.EVENT,
    eventInfo: {
      id: event.id, // 
      name: event.name,
      fee: event.fee,
      avatarUrl: avatarUrl,
      avatarName: avatarName,
      imageUrl: event.imageUrl,
      tags: event.tags ? [...event.tags, skillTag] : [skillTag], 
      userIsCaptain: event.userIsCaptain || false,
      userIsParticipant: event.userIsParticipant || false,
      recurringDays: event.recurringDays,
      isEvent: event.isEvent
    },
    sessionInfo: eventSession || undefined,
  };
}
/** =====================================
* Conversion 2: Transform type ActivityItem -> EventCardType
* Usage:
* Transform filtered activities to DisplayActivity[] for UI rendering
* const transformedActivities = useMemo(() =>
*   activities.map(transformActivitytToEventCard)
* , [activities]);
* ```
* ===================================== */

export function transformActivityToEventCard(activity: ActivityItem, cardMode: EventCardModeType): EventCardType {
  
  // ========================================
  // DIFFERENT FIELDS (based on type)
  // ========================================
  
  let avatarUrl: string;
  let avatarName: string;
  let eventName: string;
  let tag: Tag;
  let activitySession: EventCardSession;
  let userIsCaptain: boolean;
  let userIsParticipant: boolean;
  let recurringDays: DayOfWeekValue[];
  let imageUrl: string;
  let tags: Tag[];
  let isEvent: boolean;

  if (isEventActivity(activity)) {
    const { event, session } = activity;
    activitySession = session;
    // EVENT: Use club logo or captain profile picture
    avatarUrl = event.clubInfo.logoUrl || event.captainInfo?.profilePictureUrl || '';
    avatarName = event.clubInfo.name;
   
    // EVENT: Use event name
    eventName = event.name;

    // EVENT: Use skill level from tags (if available)
    tags = event.tags || [];
    tag = {
      name: event.minimumSkillLevel
              ? SkillLevelLabels[event.minimumSkillLevel]
              : "All Levels",
      color: getSkillLevelBadgeVariant(
                  event.minimumSkillLevel ?? SkillLevel.OPEN
                )
    };
    userIsCaptain = event.userIsCaptain;
    userIsParticipant = event.userIsParticipant;
    recurringDays = event.recurringDays;
    imageUrl = event.imageUrl;
    isEvent = event.isEvent
    
  } else {
    // BOOKING
    const { event, session } = activity;
    activitySession = session;
    avatarUrl = event.captainInfo.profilePictureUrl || '';
    avatarName = event.captainInfo.fullName;

    eventName = BookingTypeLabels[event.bookingType] || 'Booking';
    tags = [];
    tag = {
      name: 'Private',
      color: 'tertiary'
    }

    // add the event.courtNumber 
    activitySession = {
      ...session,
      courtNumber: event.courtNumber,
    };
    
    userIsCaptain = event.userIsOrganizer;
    userIsParticipant = true;
    recurringDays = [];
    isEvent = false;
    imageUrl = '';
    
  }

  return {
    type: activity.type,
    eventInfo: {
      id: activity.event.id, // 
      name: eventName,
      fee: activity.event.fee,
      avatarUrl: avatarUrl,
      avatarName: avatarName,
      imageUrl: imageUrl, // not available for BOOKING
      tags: [...tags, tag],
      userIsCaptain: userIsCaptain,
      userIsParticipant: userIsParticipant,
      recurringDays: recurringDays,
      isEvent: isEvent
    },
    sessionInfo: activitySession,
  };
}

/**
 * Transform array of ActivityItems or Events for the EventCard
 * Convenience function for bulk transformation
 * 
 * Usage:
 * ```tsx
 * const transformedActivities = useMemo(() =>
 *      transformActivitiesForEventCard(filteredActivities)
 * , [filteredActivities];
 * 
 * const transformedEvents = useMemo(() => 
 *      transformEventsForEventCard(events, cardMode)
 * , [events];
 * ```
 */

// HELPER functions
export function transformActivitiesForEventCard(activities: ActivityItem[]): EventCardType[] {
  return activities.map((activity) => (
    transformActivityToEventCard(activity, EventCardModes.ACTIVITY))
)}

export function transformEventsForEventCard(events: Event[], cardMode: EventCardModeType): EventCardType[] {
  return events.map((event) => (
    transformEventToEventCard(event, cardMode))
)}