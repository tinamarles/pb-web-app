// === MODIFICATION LOG ===
// Date: 2025-12-25 UTC
// Modified by: Assistant
// Changes: Created date utility functions for common date operations
// Purpose: Centralized date logic - checking ranges, comparing dates, etc.
// Why: User needs clean helper functions for button disabled states, validations, etc.
// ========================

/**
 * Check if today falls within a date range (inclusive)
 *
 * @param startDate - Start of the range (nullable)
 * @param endDate - End of the range (nullable)
 * @returns true if today is within the range, false otherwise
 *
 * @example
 * // Registration is open
 * const isOpen = isWithinDateRange(membership.openDate, membership.closeDate);
 * <Button disabled={!isOpen}>Register</Button>
 *
 * @example
 * // Event sign-up window
 * const canSignUp = isWithinDateRange(event.signUpStart, event.signUpEnd);
 */

/**
 * Format date to readable string (e.g., "Dec 31, 2025")
 *
 * @param date - Date string to format (nullable)
 * @param format - Format style ('short' | 'long')
 * @returns Formatted date string, or fallback if invalid
 *
 * @example
 * formatDate("2025-12-31") // "Dec 31, 2025"
 * formatDate("2025-12-31", "long") // "December 31, 2025"
 * formatDate(null) // "N/A"
 */
export function formatDate(
  date: string | null | undefined,
  format: "short" | "long" = "short"
): string {
  if (!date) {
    return "N/A";
  }

  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: format === "long" ? "long" : "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
}

export function isWithinDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  // If either date is missing, range is invalid
  if (!startDate || !endDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include the entire end date

  // Check if today is within range (inclusive)
  return today >= start && today <= end;
}

/**
 * Alias for isWithinDateRange - more semantic for registration periods
 *
 * @example
 * <Button disabled={!isRegistrationOpen(type.openDate, type.closeDate)}>
 *   Register
 * </Button>
 */
export function isRegistrationOpen(
  openDate: string | null | undefined,
  closeDate: string | null | undefined
): boolean {
  return isWithinDateRange(openDate, closeDate);
}

/**
 * Check if a date is in the past
 *
 * @param date - Date to check (nullable)
 * @returns true if date is before today, false otherwise
 *
 * @example
 * const isExpired = isPastDate(membership.expiryDate);
 * <Badge variant={isExpired ? 'error' : 'success'}>
 *   {isExpired ? 'Expired' : 'Active'}
 * </Badge>
 */
export function isPastDate(date: string | null | undefined): boolean {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
}

/**
 * 
 * @param dateToCheck 
 * @param dateToCheckAgainst 
 * @returns true if dateToCheck > dateToCheckAgainst
 */
export function isPastDateCheck(
  dateToCheck: string | null | undefined,
  dateToCheckAgainst: string | null | undefined
): boolean {
  if (!dateToCheck || !dateToCheckAgainst) {
    return false;
  }

  const checkDateAgainst = new Date(dateToCheckAgainst);
  checkDateAgainst.setHours(0, 0, 0, 0);

  const checkDate = new Date(dateToCheck);
  checkDate.setHours(0, 0, 0, 0);

  return checkDateAgainst > checkDate;
}

/**
 * Check if a date is in the future
 *
 * @param date - Date to check (nullable)
 * @returns true if date is after today, false otherwise
 *
 * @example
 * const isUpcoming = isFutureDate(event.startDate);
 * <Icon name={isUpcoming ? 'calendar-clock' : 'calendar-check'} />
 */
export function isFutureDate(date: string | null | undefined): boolean {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate > today;
}

/**
 * Check if a date is today
 *
 * @param date - Date to check (nullable)
 * @returns true if date is today, false otherwise
 *
 * @example
 * const isToday = isDateToday(event.startDate);
 * {isToday && <Badge variant="info">Happening Today!</Badge>}
 */
export function isDateToday(date: string | null | undefined): boolean {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate.getTime() === today.getTime();
}

/**
 * Get number of days between today and a date
 * Positive = future, Negative = past
 *
 * @param date - Date to compare (nullable)
 * @returns Number of days, or null if date is invalid
 *
 * @example
 * const daysUntil = getDaysUntil(membership.expiryDate);
 * if (daysUntil !== null && daysUntil <= 30) {
 *   // Show renewal reminder
 * }
 */
export function getDaysUntil(date: string | null | undefined): number | null {
  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if a date is within X days from now
 *
 * @param date - Date to check (nullable)
 * @param days - Number of days threshold
 * @returns true if date is within X days, false otherwise
 *
 * @example
 * const isClosingSoon = isWithinDays(registration.closeDate, 30);
 * {isClosingSoon && <Badge variant="warning">Closing Soon!</Badge>}
 */
export function isWithinDays(
  date: string | null | undefined,
  days: number
): boolean {
  const daysUntil = getDaysUntil(date);
  if (daysUntil === null) {
    return false;
  }

  return daysUntil >= 0 && daysUntil <= days;
}
