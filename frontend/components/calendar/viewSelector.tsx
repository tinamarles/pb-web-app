"use client";
// components/calendar/viewSelector.tsx
import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Icon, Badge, Button, ButtonVariant, DateDisplay, Modal } from "@/ui";
import { 
  getWeekStart,
  getWeekEnd,
  getWeekDays, 
  toISODate, 
  navigateByWeeks
} from "@/lib/calendarUtils";
import { isSameDay, isDateToday, isTodayWithinDateRange, dateFromDjango } from "@/lib/dateUtils";
import { CalendarViewMode, CalendarViewModeType } from "@/lib/constants";

// ========================================
// TYPES
// ========================================
type Variant = "events" | "schedule";

interface ViewSelectorProps {
  variant: Variant;
  date?: Date;
  activities?: Date[]; // all dates that have activities so the badge can be shown
  nextActivity?: string;
  onViewModeChange?: (mode: CalendarViewModeType) => void;
  onWeekChange?: (startDate: Date, endDate: Date) => void;
  onDateChange?: (date: Date) => void;
  children?: React.ReactNode;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if a date has an activity (for badge display)
 * 
 * NOTE: The .some() method in JavaScript is an array instance method 
 * that tests whether at least one element in an array passes a condition 
 * defined by a provided callback function. It returns a boolean value 
 * (true or false). 
 */
function hasActivity(date: Date, activities?: Date[]): boolean {
  if (!activities || activities.length === 0) return false;

  const dateString = toISODate(date);
  return activities.some((activityDate) => toISODate(activityDate) === dateString);
}

// ========================================
// MAIN COMPONENT
// ========================================
export function ViewSelector({
  variant,
  date, // if you want to rename it then write date: newName;
  activities,
  nextActivity,
  onViewModeChange,
  onWeekChange,
  onDateChange,
  children,
}: ViewSelectorProps) {

  // ========================================
  // Data & State
  // ========================================
  const [viewMode, setViewMode] = useState<CalendarViewModeType>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  

  // set default values for week (determined by initial state of selectedDate)
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = getWeekEnd(selectedDate);
  const weekDays = getWeekDays(selectedDate);

  // Mobile only has 2 viewModes: 'grid view' and 'list view', the latter being
  // basically a weekly view
  const isListView = viewMode === CalendarViewMode.WEEKLY

  // ========================================
  // Effects
  // ========================================

  // Handle external date changes 
  // Example: user clicks 'Next activity on Feb 5, 2026 ->' Button 
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

  // Tell parent when the selectedDate changes
  useEffect(() => {
    onDateChange?.(selectedDate);
  }, [selectedDate, onDateChange]);

  // Tell parent when the week changes (only for weekly mode)
  useEffect(() => {
    if (viewMode === CalendarViewMode.WEEKLY) {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = getWeekEnd(selectedDate);
      onWeekChange?.(weekStart, weekEnd);
    }
  }, [selectedDate, viewMode, onWeekChange]);

  // ========================================
  // Handlers
  // ========================================
  const handleViewModeChange = (mode: CalendarViewModeType) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
    // Set default values when switching to daily mode
    if (mode === CalendarViewMode.DAILY) {
      if (isTodayWithinDateRange(
        getWeekStart(selectedDate),
        getWeekEnd(selectedDate)
      )) {
        setSelectedDate(new Date()); // set date to Today
      } else {
        setSelectedDate(getWeekStart(selectedDate)); // set to first day of week
      }
    }
  };

  const handleWeekNavigate = (direction: 'prev' | 'next') => {
    const weeks = direction === 'next' ? 1 : -1;
    setSelectedDate(navigateByWeeks(selectedDate, weeks));
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // 🎯 KEY FIX: Switch to daily mode when clicking a specific day
    // This ensures the parent filters to just this day's activities
    if (viewMode === CalendarViewMode.WEEKLY) {
      setViewMode(CalendarViewMode.DAILY);
      onViewModeChange?.(CalendarViewMode.DAILY);
    }
  }

  const handleCurrentWeekClick = () => {
    setSelectedDate(new Date());
    // Tell parent to re-filter if switching from daily to weekly mode
    if (viewMode === CalendarViewMode.DAILY) {
      setViewMode(CalendarViewMode.WEEKLY);
      onViewModeChange?.(CalendarViewMode.WEEKLY);
    }
  }
  const handleNextActivityClick = () => {
    if (nextActivity) {
      const newDate = dateFromDjango(nextActivity); // ✅ Use the helper function!
      
      setSelectedDate(newDate);
      onWeekChange?.(getWeekStart(newDate), getWeekEnd(newDate));
    }
  }

  // ========================================
  // Functions & Components
  // ========================================

  // Helper function to determine which button is active 
  const isButtonActive = (pos: number, currentMode: CalendarViewModeType): boolean => {
    switch (pos) {
      case 1: return currentMode === CalendarViewMode.GRID;
      case 2: return currentMode === CalendarViewMode.WEEKLY;
      case 3: return currentMode === CalendarViewMode.DAILY;
      default: return false;
    }
  };
  // Helper function to determine what variant of button based on active state
  const getButtonVariant = (isActive: boolean): ButtonVariant => {
    return isActive ? 'filled' : 'primary';
  };
  // Helper function to determine Icon fill class for grid icon
  const getIconClass = (pos: number, isActive: boolean): string => {
    if (pos === 1 && isActive) return 'fill-on-primary';
    if (pos === 1 && !isActive) return 'fill-primary';
    return '';
  };
  const ButtonGroup = () => {
    // determine which button is active
    const btn1Active = isButtonActive(1, viewMode);
    const btn2Active = isButtonActive(2, viewMode);
    const btn3Active = isButtonActive(3, viewMode);
    
    return (
      <div className="btn-group">
        <Button
          size='sm'
          variant={getButtonVariant(btn1Active)}
          className="rounded-none rounded-tl-sm rounded-bl-sm"
          icon='grid'
          label='Grid'
          iconClassName={getIconClass(1, btn1Active)}
          onClick={() => handleViewModeChange(CalendarViewMode.GRID)}
        />
        <Button
          size='sm'
          variant={getButtonVariant(btn2Active)}
          className="rounded-none"
          icon='weekly'
          label='Weekly'
          iconClassName={getIconClass(2, btn2Active)}
          onClick={() => handleViewModeChange(CalendarViewMode.WEEKLY)}
        />
        <Button
          size='sm'
          variant={getButtonVariant(btn3Active)}
          className="rounded-none rounded-tr-sm rounded-br-sm"
          icon='daily'
          label='Daily'
          iconClassName={getIconClass(3, btn3Active)}
          onClick={() => handleViewModeChange(CalendarViewMode.DAILY)}
        />
      </div>
    )
  }
  const WeekDisplay = () => {
    return (
      <div className="flex items-center justify-between md:justify-center md:gap-3xl w-full">
        <Icon 
          name='prev' 
          size='lg' 
          onClick={() => handleWeekNavigate('prev')}
        />
        <div className='flex items-center gap-sm'>
          <DateDisplay date={toISODate(weekStart)} format='short-noYear' />
          <span>{' - '}</span>
          <DateDisplay date={toISODate(weekEnd)} format='short-noYear' />
        </div>
        <Icon 
          name='next' 
          size='lg' 
          onClick={() => handleWeekNavigate('next')}
        />
      </div>
    )
  }
  const DayDisplay = ({ 
    showNav = false,  // ✅ Default value
  }: { 
    showNav?: boolean;  // ✅ Make it optional with ?
  }) => {
    return (
      <div className="flex gap-3xl justify-center mt-md">
        {showNav && (
          <Icon 
            name='prev' 
            size='lg' 
            onClick={() => handleWeekNavigate('prev')}
          />
        )}
        <div className="flex gap-md justify-center">
          {weekDays.map((day, index) => {
            const dayName = day.toLocaleDateString('en-US', { weekday: 'short'}).toUpperCase();
            const dayNumber = day.getDate().toString();
            // 🎯 FIX: Only highlight day if we're in DAILY mode
            // In weekly mode, no day should appear selected
            const isSelected = viewMode === CalendarViewMode.DAILY && isSameDay(day, selectedDate);
            const showBadge = hasActivity(day, activities);
            return (
              <div key={index} className="flex flex-col gap-xs items-center">
                
                <p>{dayName}</p>
                <Button
                  label={dayNumber}
                  variant={isSelected ? "filled" : "subtle"}
                  size='sm'
                  className="border-none rounded-full w-8 h-8"
                  onClick={() => handleDateClick(day)}
                />
                {showBadge && <Badge size='sm' variant='success' />}
              </div>
            )
          })}
        </div>
        {showNav && (
          <Icon 
            name='next' 
            size='lg' 
            onClick={() => handleWeekNavigate('next')}
          />
        )}
      </div>
    )
  }
  // ========================================
  // RENDER
  // ========================================
  /**
   * For Events:
   * viewMode = grid
   *  mobile: shows either Grid View or List View Button  
   *  desktop: shows standard Grid | Daily | Weekly ButtonGroup
   * 
   * viewMode = weekly (= List View for Mobile)
   *  mobile: shows Week Selector and Mon - Sun days; Button View current Week + Pick a Date
   *          for variant='schedule' also show badge for days with activities
   *  desktop: same as mobile
   * 
   * viewMode = daily (= List View for Mobile)
   *  mobile: same as weekly
   *  desktop: shows Day Selector, Today Button, and Pick a Date Button
   * 
   * For Schedule:
   * viewMode = weekly 
   *  mobile: shows Week Selector, shows Days with Badge if Day has activity
   *          NOTE: (user cannot change a viewMode but can either scroll 
   *                forwards/backwards by a week or select a day of the current week shown)
   * 
   * 
   */

  return (
    <div className="page-sandwich">
      <div className="page-sandwich-header">
        {/* MOBILE VERSION (< 768px): not possible to show a 7 day grid smaller */}
        <div className="vs-mobile">
          {variant === 'events' && (
            <>
              <div className='flex items-center justify-end'>
              {/* Show the toggle button 'Grid View' | 'List View */}
                <Button
                  variant='primary'
                  size="sm"
                  icon={isListView ? "grid" : "list"}
                  iconClassName={isListView ? 'fill-primary' : ''}
                  label={isListView ? "Grid View" : "List View"}
                  onClick={()=> handleViewModeChange(isListView ? CalendarViewMode.GRID : CalendarViewMode.WEEKLY)}
                />
              </div>

              {/* If in List View -> Weekly View */}
              {isListView && (
                <div className=''>
                  
                </div>
              )}

              {/* If in List View -> Show fixed 'Pick a Date' Button at the bottom */}
              {isListView && (
                <div className=''>
                  
                </div>
              )}
            </>
          )}

          {/* Mobile: variant 'schedule' - User's Activities */}
          {variant === 'schedule' && (
            <div className =''>
              {/* Show the Week Scroll */}
              <WeekDisplay />
              {/* Show the Day Selector */}
              <DayDisplay />
            </div>
          )}
        </div>

        {/* DESKTOP VERSION (>= 768px) */}
        <div className='vs-desktop'>
          {/* Show Button Group */}
          <ButtonGroup />
          {viewMode === CalendarViewMode.WEEKLY && <WeekDisplay />}
          {viewMode === CalendarViewMode.DAILY && <DayDisplay showNav={true} />}
        </div>
      </div>
      <div className="page-sandwich-filling">
        {children}
      </div>
      <div className="page-sandwich-footer">
        <div className="flex justify-end">
          {viewMode === CalendarViewMode.DAILY && (
            <Button
              variant='highlighted'
              size='sm'
              label='View Current Week'
              iconPosition="right"
              icon='arrowright'
              onClick={handleCurrentWeekClick}
            />
          )}
          {viewMode === CalendarViewMode.WEEKLY && nextActivity && (
            <Button
              variant='highlighted'
              size='sm'
              label={`Next Activity on ${nextActivity}`}
              iconPosition="right"
              icon='arrowright'
              onClick={handleNextActivityClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}