/**
 * Calendar utility functions for Activities page
 * 
 * Handles:
 * - Week calculations (configurable start day: Monday or Sunday)
 * - Date navigation (daily/weekly)
 * - Activity grouping by date
 * 
 * IMPORTANT: Backend always uses DayOfWeek constant (Monday=0, Sunday=6)
 *            Only frontend display adjusts based on user preference!
 */

import type { ActivityItem, EventCardType, WeekData } from '@/lib/definitions';
import { 
    DayOfWeek, 
    jsDateToDayOfWeek, 
    dayOfWeekToJsDay, 
    type DayOfWeekValue,
    ActivityType } from '@/lib/constants';

// ========================================
// WEEK START CONFIGURATION
// ========================================

/**
 * Default week start day (can be overridden by user preference)
 * ISO 8601 International Standard: Monday
 */
export const DEFAULT_WEEK_START: DayOfWeekValue = DayOfWeek.MONDAY;

// ========================================
// WEEK NAVIGATION
// ========================================

/**
 * Get the start of the week containing the given date
 * 
 * @param date - Any date
 * @param weekStartDay - Day the week starts (default: Monday per ISO 8601)
 * @returns Date object for the first day of that week
 * 
 * @example
 * const wed = new Date('2026-02-11');  // Wednesday
 * 
 * // Monday start: Returns Feb 9 (Monday)
 * getWeekStart(wed, DayOfWeek.MONDAY);
 * 
 * // Sunday start: Returns Feb 8 (Sunday)
 * getWeekStart(wed, DayOfWeek.SUNDAY);
 */
export function getWeekStart(date: Date, weekStartDay: DayOfWeekValue = DEFAULT_WEEK_START): Date {
  const d = new Date(date);
  const ourDay = jsDateToDayOfWeek(d);  // Convert JS day to our constant
  
  // Calculate days to subtract to get to week start
  // Example: If today is Wed (2) and week starts Mon (0): 2 - 0 = 2 days back
  // Example: If today is Wed (2) and week starts Sun (6): (2 - 6 + 7) % 7 = 3 days back
  let daysToSubtract = ourDay - weekStartDay;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;  // Handle wrap-around (e.g., Mon-Tue when week starts Sun)
  }
  
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - daysToSubtract);
  return weekStart;
}

/**
 * Get the end of the week containing the given date
 * 
 * @param date - Any date
 * @param weekStartDay - Day the week starts (default: Monday per ISO 8601)
 * @returns Date object for the last day of that week (6 days after start)
 * 
 * @example
 * const wed = new Date('2026-02-11');  // Wednesday
 * 
 * // Monday start: Returns Feb 15 (Sunday)
 * getWeekEnd(wed, DayOfWeek.MONDAY);
 * 
 * // Sunday start: Returns Feb 14 (Saturday)
 * getWeekEnd(wed, DayOfWeek.SUNDAY);
 */
export function getWeekEnd(date: Date, weekStartDay: DayOfWeekValue = DEFAULT_WEEK_START): Date {
  const weekStart = getWeekStart(date, weekStartDay);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);  // Week is always 7 days
  return weekEnd;
}


/**
 * Get the current week (Monday - Sunday)
 * TODO: Move to dateUtils.ts?
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: getWeekStart(today),
    end: getWeekEnd(today)
  };
}
/**
 * Get array of 7 dates for the week containing the given date
 * @param date - Any date within the week (or use getWeekStart() for specific week start day)
 * @returns Array of Date objects for 7 consecutive days starting from week start
 * 
 * @example
 * // Default: Monday start
 * const days = getWeekDays(new Date('2026-02-11'));  // Wed
 * // Returns: [Feb 9 (Mon), Feb 10 (Tue), ..., Feb 15 (Sun)]
 * 
 * @example
 * // Custom: Sunday start
 * const sundayStart = getWeekStart(new Date('2026-02-11'), DayOfWeek.SUNDAY);
 * const days = getWeekDays(sundayStart);
 * // Returns: [Feb 8 (Sun), Feb 9 (Mon), ..., Feb 14 (Sat)]
 */
export function getWeekDays(date: Date): Date[] {
  const weekStart = getWeekStart(date);
  const days: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  
  return days;
}
/**
 * Get the week (Monday - Sunday) containing a specific date
 * @param date - Date to find the week for
 * @returns Object with start (Monday) and end (Sunday) dates
 * 
 * @example
 * // User picks Feb 11, 2026 (Tuesday)
 * const week = getWeekForDate(new Date('2026-02-11'));
 * // Returns: { start: Feb 09 (Mon), end: Feb 15 (Sun) }
 */
export function getWeekForDate(date: Date): { start: Date; end: Date } {
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date)
  };
}

/**
 * Navigate by weeks (always jumps by 7 days)
 * @param currentDate - Current date
 * @param weeks - Number of weeks to move (positive = forward, negative = backward)
 */
export function navigateByWeeks(currentDate: Date, weeks: number): Date {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + (weeks * 7));
  return newDate;
}

/**
 * Navigate by days
 * @param currentDate - Current date
 * @param days - Number of days to move (positive = forward, negative = backward)
 */
export function navigateByDays(currentDate: Date, days: number): Date {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

// ========================================
// ACTIVITY GROUPING
// ========================================

/**
 * Generic function to group items by date
 * Works with ANY type - just tell it how to extract the date!
 * 
 * @param items - Array of any type
 * @param getDate - Function that extracts the date string from each item
 * @returns Map of date string (YYYY-MM-DD) to items
 * 
 * Example usage:
 *   // For ActivityItem:
 *   groupByDate(activities, (a) => a.session.date)
 * 
 *   // For EventCardType:
 *   groupByDate(transformedActivities, (a) => a.sessionInfo!.date)
 */
export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  for (const item of items) {
    const dateKey = getDate(item);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  }
  
  return grouped;
}

/**
 * Group ActivityItem by date (convenience wrapper)
 * @param activities - List of ActivityItem (from API)
 * @returns Map of date string (YYYY-MM-DD) to activities
 */
export function groupActivitiesByDate(
  activities: ActivityItem[]
): Map<string, ActivityItem[]> {
  return groupByDate(activities, (a) => a.session.date);
}

/**
 * Group EventCardType by date (convenience wrapper)
 * @param activities - List of EventCardType (transformed)
 * @returns Map of date string (YYYY-MM-DD) to activities
 */
export function groupTransformedActivitiesByDate(
  activities: EventCardType[]
): Map<string, EventCardType[]> {
  return groupByDate(activities, (a) => a.sessionInfo!.date);
}

/**
 * Get activities for a specific date
 */
export function getActivitiesForDate(
  activities: ActivityItem[],
  date: Date
): ActivityItem[] {
  const dateString = toISODate(date); // YYYY-MM-DD
  return activities.filter(activity => {
    const activityDate = activity.session.date
    return activityDate === dateString;
  });
}

/**
 * Get activities for a date range
 */
export function getActivitiesForDateRange(
  activities: ActivityItem[],
  startDate: Date,
  endDate: Date
): ActivityItem[] {
  const start = toISODate(startDate);
  const end = toISODate(endDate);
  
  return activities.filter(activity => {
    const activityDate = activity.session.date
    return activityDate >= start && activityDate <= end;
  });
}

/**
 * Get activities for a week (Monday - Sunday)
 * @param activities - List of ActivityItem (from API)
 * @param date - Optional date within the week (defaults to today)
 * @returns Activities for that week
 * 
 * @example
 * // Get activities for current week
 * const thisWeek = getActivitiesForWeek(activities);
 * 
 * // Get activities for week containing Feb 11
 * const specificWeek = getActivitiesForWeek(activities, new Date('2026-02-11'));
 */
export function getActivitiesForWeek(
  activities: ActivityItem[],
  date?: Date
): ActivityItem[] {
  const targetDate = date || new Date();
  const { start, end } = getWeekForDate(targetDate);
  return getActivitiesForDateRange(activities, start, end);
}

// ========================================
// TIME CALCULATIONS
// ========================================

/**
 * Calculate duration in minutes
 * export function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  if (!startTime || !endTime) {
    return "N/A";
  }
 */
export function calculateDuration(
  startTime: string | null | undefined, 
  endTime: string | null | undefined,
): number {
  if (!startTime || !endTime) {
    return 0;
  }
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes - startTotalMinutes;
}

/**
 * Format duration for display
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2 hrs" or "1.5 hrs"
 */
export function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  
  if (hours === Math.floor(hours)) {
    // Whole number of hours
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  
  // Has fractional hours
  return `${hours.toFixed(1)} hrs`;
}

export function toISODate(date: Date): string {
  // ❌ OLD: date.toISOString() converts to UTC first, causing timezone shifts!
  // return date.toISOString().split('T')[0];
  
  // ✅ NEW: Use local date components to avoid UTC conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateString(date: string): string {
  return date.split('T')[0];
}