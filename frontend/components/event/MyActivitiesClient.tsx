"use client";
// components/event/MyActivitiesClient.txt
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { useState, useCallback, useMemo } from "react";
import { 
  ActivityItem, 
  EventCardType, 
} from "@/lib/definitions";
import { Button, DateDisplay } from "@/ui";
import { EmptyState } from "../EmptyState";
import { 
  EventAction, 
  EventActionType, 
  EventCardModes,
  CalendarViewMode,
  CalendarViewModeType, 
  ActivityType,
  ActivityTypeValue
} from "@/lib/constants";
import { 
  getActivitiesForDate, 
  getActivitiesForWeek, 
  getDateString, 
  getWeekEnd, 
  toISODate,
  groupByDate,
  getWeekDays,
 } from "@/lib/calendarUtils";
import { transformActivitiesForEventCard } from "@/lib/activityUtils";
import { dateFromDjango, formatTimeRange, isToday } from "@/lib/dateUtils";
import { toast } from "sonner";
import { ViewSelector } from "../calendar/viewSelector";
import { ActivityCard } from "./ActivityCard";
import { EventCard, EventCardVariant } from "./EventCard";

interface MyActivitiesClientProps {
  activities: ActivityItem[];
}

export function MyActivitiesClient({ activities }: MyActivitiesClientProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  
  const router = useRouter();
  const { user } = useAuth();
    
  const activitiesAvailable = activities.length > 0;

  // State for VIEW CONTROLS only (user interactions):
  const [viewMode, setViewMode] = useState<CalendarViewModeType>('weekly');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });  // ✅
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [weekEnd, setWeekEnd] = useState<Date | null>(null);
  const weekDays = getWeekDays(selectedDate);
  // ========================================
  // EVENT HANDLERS
  // ========================================

  // Callback functions for ViewSelector
  const handleViewModeChange = useCallback((mode: CalendarViewModeType) => {
    // alert(`Received changed viewMode: ${mode}`);
    setViewMode(mode);
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    // alert(`Received changed date: ${date}`);
    setSelectedDate(date);
  }, []);

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    // alert(`Received changed week: ${start} - ${end}`);
    setWeekStart(start);
    setWeekEnd(end);
  }, []);

  const handleActivityCardAction = (
      activity: EventCardType, 
    ) => {
      switch (activity.type) {
        case ActivityType.EVENT:
          router.push(`/event/${activity.eventInfo.id}?sessionId=${activity.sessionInfo?.id}`);
          break;
        case ActivityType.BOOKING:
          toast.info("Booking Details coming soon!");
          break;
        default:
          toast.error("Unknown activity type!");
      }
    }
  
  const handleEventCardAction = (
    action: EventActionType,
    event: EventCardType,
    e?: React.MouseEvent // ✅ Accept but don't need to use!
  ) => {
    // Currently only VIEW_DETAILS action is available for activities, but we can expand in the future if needed
    if (event.type === ActivityType.EVENT) {
      switch (action) {
        case EventAction.VIEW_DETAILS:
          const url =  `/event/${event.eventInfo.id}`;
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
      }
    } else {
      switch (action) {
        case EventAction.VIEW_DETAILS:
          toast.info("Booking Details coming soon!");
          break;
      }
    }
  };
  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================

  // Filter the activities
  const filteredActivities = useMemo(() => {
    switch (viewMode) {
      case CalendarViewMode.DAILY:
        return getActivitiesForDate(activities, selectedDate);
      
      case CalendarViewMode.WEEKLY:
        return getActivitiesForWeek(activities, selectedDate);
        // OR if you want to use weekStart/weekEnd from ViewSelector:
        // return getActivitiesForDateRange(activities, weekStart, weekEnd);
      
      case CalendarViewMode.GRID:
      default:
        return activities;
    }
  }, [activities, viewMode, selectedDate]);

  // Find next activity date 
  const nextActivity = useMemo(() => {
    const weekEnd = toISODate(getWeekEnd(selectedDate));
     return activities.find(activity => activity.session.date > weekEnd)?.session.date
  }, [selectedDate, activities]);

  // Extract unique dates for the entire week
  const activityDates = useMemo(() => {
    // Get activities for the current week being viewed
    const weekActivities = getActivitiesForWeek(activities, selectedDate);
    
    const uniqueDateStrings = new Set(
      weekActivities.map(activity => {
        // activity.session.date is ISO string like "2026-02-05T10:00:00Z"
        // Extract just the date part: "2026-02-05"
        return getDateString(activity.session.date);
      })
    )
    
    // Convert back to Date objects using dateFromDjango helper
    return Array.from(uniqueDateStrings).map(dateStr => dateFromDjango(dateStr));
  }, [activities, selectedDate]);

  // Transform the filtered activities into the format for the EventCard
  // Transform filtered activities to DisplayActivity[] for UI rendering
  const transformedActivities = useMemo(() =>
    transformActivitiesForEventCard(filteredActivities)
  , [filteredActivities]);

  // Create a Map containing activities array for each day:
  const grouped = groupByDate(transformedActivities, (a) => a.sessionInfo!.date);

  const DisplayDailyActivities = () => {
    return (
      <div className="flex flex-col gap-sm mt-md w-full md:px-4xl lg:px-6xl">
        <DateDisplay date={toISODate(selectedDate)} format="weekday-long" className="title-sm strong text-on-surface-variant uppercase"/>
        {transformedActivities.length > 0 ? (
          // Will use <ActivityCard variant='default' activity={activity} onAction={handleActivityCardAction} />
          transformedActivities.map((activity, index) => (
            // <div className="flex flex-col gap-sm p-sm border border-outline-variant bg-surface-container-low rounded-md" key={index}>
            //   <p className="label-sm">{formatTimeRange(activity.sessionInfo?.startTime, activity.sessionInfo?.endTime)}</p>
            //   <p className="label-lg">{activity.eventInfo.name}</p>
            // </div>
            <ActivityCard
              key={index}
              variant='default'
              activity={activity}
              onAction={handleActivityCardAction}
            />
          ))
        ): (
          <p className="text-warning">No activities for this day!</p>
        )}
      </div>
    );
  };

  const WeeklyActivities = ({variant='default'}: {variant?: 'default' | 'calendar'}) => {

    return (
      weekDays.map((day, index) => {
        const activitiesForDay = grouped.get(toISODate(day));
        const todayTextColor = isToday(day) ? "text-primary" : "text-on-surface-variant";
        const todayBorderColor = isToday(day) ? "border-primary" : "border-outline";
        return (
          <div key={index} className='flex flex-col gap-sm mb-sm'>
            {variant === 'calendar' && (
              <div className={`flex flex-col rounded-md p-sm border ${todayBorderColor}`}>
                <DateDisplay date={toISODate(day)} format="weekday-only" className={`label-md ${todayTextColor} uppercase`}/>
                <DateDisplay date={toISODate(day)} format="day-only" className={`headline-sm strong ${todayTextColor}`}/>
              </div>
            )}
            {variant === 'default' && (
                <DateDisplay date={toISODate(day)} format="weekday-long" className="title-sm strong text-on-surface-variant uppercase"/>
            )}
            
            {activitiesForDay && (
              activitiesForDay.map((activity, index) => (
                <ActivityCard
                  key={index}
                  variant={variant}
                  activity={activity}
                  onAction={handleActivityCardAction}
                />
              ))
            )}
            {!activitiesForDay && (
              <p className="label-md p-sm text-warning">No activities for this day!</p>
            )}
          </div>
        );
      })
    );
  };

  const DisplayWeeklyActivities = () => {
    return (
      <>
        <div className='activityList-desktop'>
          <div className='grid grid-cols-7 gap-sm mt-lg'>
            <WeeklyActivities variant="calendar" />
          </div>
        </div>
        <div className='activityList-mobile mt-md md:px-4xl'>
          <WeeklyActivities variant="default"/>
        </div>
      </>
    );
  };

  const DisplayGridActivities = () => {
    const gridVariant = "grid-3 xl:grid-cols-4";
    const cardVariant = "grid-display";

    return (
          <div className={`clubList-container ${gridVariant}`}>
            {transformedActivities.map((event, index) => (
              <EventCard
                key={index}
                event={event}
                mode={EventCardModes.ACTIVITY}
                variant={cardVariant}
                onAction={handleEventCardAction}
              />
            ))}
          </div>
    );
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="calendar-container">
      <ViewSelector
        variant='schedule'
        activities={activityDates}
        nextActivity={nextActivity}
        onViewModeChange={handleViewModeChange}
        onDateChange={handleDateChange}
        onWeekChange={handleWeekChange}
      >
        {activitiesAvailable ? (
          <>
              {viewMode === CalendarViewMode.WEEKLY && <DisplayWeeklyActivities />}
              {viewMode === CalendarViewMode.DAILY && <DisplayDailyActivities />}
              {viewMode === CalendarViewMode.GRID && <DisplayGridActivities />}
          </>
        ) : (
          
          <EmptyState
            icon="events"
            title="No Activities to show!"
            description="You do not have any activities yet. "
            className="text-on-surface bg-surface-container-lowest rounded-md"
            actionLabel="Join an event"
            actionIcon="add"
            href="/event/list"
          />
        )}
      </ViewSelector>
    </div>
  );
}