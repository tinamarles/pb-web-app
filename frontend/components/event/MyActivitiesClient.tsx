"use client";
// components/event/MyActivitiesClient.txt
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { useState, useCallback, useMemo } from "react";
import { 
  ActivityItem, 
  EventCardType, 
} from "@/lib/definitions";
import { Button } from "@/ui";
import { EmptyState } from "../EmptyState";
import { 
  EventAction, 
  EventActionType, 
  EventCardModes,
  CalendarViewMode,
  CalendarViewModeType 
} from "@/lib/constants";
import { getActivitiesForDate, getActivitiesForWeek, getDateString, getWeekEnd, toISODate } from "@/lib/calendarUtils";
import { transformActivitiesForEventCard } from "@/lib/activityUtils";
import { dateFromDjango } from "@/lib/dateUtils";
import { toast } from "sonner";
import { ViewSelector } from "../calendar/viewSelector";

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

  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================

  // Filter the activities
  const filteredActivities = useMemo(() => {
    console.log('🔍 FILTERING - viewMode:', viewMode, 'selectedDate:', selectedDate.toISOString());
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

  // ========================================
  // RENDER
  // ========================================

  // Step 1: Show the ViewSelector
  // Step 2: Show the Activities
  //    grid -> use EventCard 
  //    // Handle event actions just pass through
  //       const handleEventAction = (action: EventActionType, event: Event) => {    
  //         onAction(action, event);
  //       }
  //       transformedActivities.map((event) => (              
  //         <EventCard
  //            key={event.id}
  //            event={event}
  //            mode={EventCardModes.ACTIVITY}
  //            variant='grid-display'
  //            onAction={handleEventAction}
  //          />
  //       ))
  //    weekly -> need a new component that
  //        builds the table layout/ grid layout for desktop
  //        fills that weekly grid with the ActivityCard (also a new component)
  //    daily -> need a new component that
  //        shows the ActivityCard in just 1-col layout
  //
  // NOTE: for mobile weekly and daily are the same layout.

  return (
    <div className="container p-0 mx-auto flex-1">
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
            <h2 className="subheading-md text-primary">
              Activities to show: {transformedActivities.length}
              <div className="flex flex-col">
                  {transformedActivities.map((activity) => (
                  <div className='flex items-center gap-sm' key={activity.sessionInfo?.id}>
                    <p>{activity.sessionInfo?.id}</p>
                    <p>{activity.sessionInfo?.date}</p>
                    <p>{activity.eventInfo.name}</p>
                  </div>
                  ))}
              </div>
            </h2>
            <h2 className="subheading-md text-primary">
              Unique Dates: {activityDates.length}
            </h2>
            <div className="flex flex-col">
                  {activityDates.map((date, index) => (
                  <div className='flex items-center gap-sm' key={index}>
                    <p>
                      {toISODate(date)} ({date.toDateString()})
                    </p>
                    
                  </div>
                  ))}
              </div>
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