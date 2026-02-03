// === MODIFICATION LOG ===
// Date: 2026-01-20 UTC
// Modified by: Assistant
// Changes: Fixed ALL date parsing to use LOCAL timezone instead of UTC
// Why: new Date("2026-01-20") treats string as UTC midnight, causing timezone bugs!
//      Now using parseLocalDate() helper to parse "YYYY-MM-DD" in user's local timezone
// Previous: All functions used new Date(dateString) - broke for users in timezones behind UTC
// ========================

/**
 * 🔧 HELPER: Parse "YYYY-MM-DD" string in LOCAL timezone (not UTC!)
 * 
 * @param dateString - Date string in "YYYY-MM-DD" format
 * @returns Date object in local timezone
 * 
 * ⚠️ CRITICAL: new Date("2026-01-20") treats it as UTC midnight!
 *    - In EST (UTC-5): "2026-01-20" becomes 2026-01-19 at 7pm!
 *    - This helper parses it as 2026-01-20 midnight in YOUR timezone
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // month is 0-indexed in JavaScript Date!
  return new Date(year, month - 1, day);
}
/**
 * Format time string to readable 12-hour format
 *
 * @param time - Time string in "HH:MM:SS" or "HH:MM" format (nullable)
 * @returns Formatted time string (e.g., "1:00 PM"), or fallback if invalid
 *
 * @example
 * formatTime("13:00:00") // "1:00 PM"
 * formatTime("09:30:00") // "9:30 AM"
 * formatTime("00:00:00") // "12:00 AM"
 * formatTime(null) // "N/A"
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) {
    return "N/A";
  }

  try {
    // Parse time string (HH:MM:SS or HH:MM)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a date object with arbitrary date (we only care about time)
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Format to 12-hour time with AM/PM
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return "Invalid Time";
  }
}

/**
 * Format time range to readable string
 *
 * @param startTime - Start time in "HH:MM:SS" or "HH:MM" format (nullable)
 * @param endTime - End time in "HH:MM:SS" or "HH:MM" format (nullable)
 * @returns Formatted time range (e.g., "7:00 PM - 9:00 PM"), or fallback if invalid
 *
 * @example
 * formatTimeRange("19:00:00", "21:00:00") // "7:00 PM - 9:00 PM"
 * formatTimeRange("09:30:00", "11:00:00") // "9:30 AM - 11:00 AM"
 * formatTimeRange(null, "21:00:00") // "N/A"
 */
export function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string {
  if (!startTime || !endTime) {
    return "N/A";
  }

  const start = formatTime(startTime);
  const end = formatTime(endTime);
  
  if (start === "Invalid Time" || end === "Invalid Time") {
    return "Invalid Time";
  }

  return `${start} - ${end}`;
}
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
    // ✅ Parse in local timezone
    const d = parseLocalDate(date);
    return d.toLocaleDateString("en-US", {
      month: format === "long" ? "long" : "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
}

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

  // ✅ Parse in local timezone
  const start = parseLocalDate(startDate);
  start.setHours(0, 0, 0, 0);

  const end = parseLocalDate(endDate);
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

  // ✅ Parse in local timezone
  const checkDate = parseLocalDate(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
}

/**
 * Check if dateToCheck is BEFORE dateToCheckAgainst
 * 
 * @param dateToCheck - First date
 * @param dateToCheckAgainst - Second date
 * @returns true if dateToCheck < dateToCheckAgainst
 */
export function isPastDateCheck(
  dateToCheck: string | null | undefined,
  dateToCheckAgainst: string | null | undefined
): boolean {
  if (!dateToCheck || !dateToCheckAgainst) {
    return false;
  }

  // ✅ Parse in local timezone
  const checkDateAgainst = parseLocalDate(dateToCheckAgainst);
  checkDateAgainst.setHours(0, 0, 0, 0);

  const checkDate = parseLocalDate(dateToCheck);
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

  // ✅ Parse in local timezone
  const checkDate = parseLocalDate(date);
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

  // ✅ Parse in local timezone
  const checkDate = parseLocalDate(date);
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

  // ✅ Parse in local timezone
  const targetDate = parseLocalDate(date);
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

export function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
  // alt: today.toISOString().split('T')[0];
}