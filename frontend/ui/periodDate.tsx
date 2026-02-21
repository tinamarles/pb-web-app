// === MODIFICATION LOG ===
// Date: 2025-12-25 UTC
// Modified by: Assistant
// Changes: Created RegistrationPeriodDate component for date range status
// Purpose: Handles complex registration period logic with open/close dates
// Why: User needs color coding based on registration window status
// States: Not open yet, Open (safe), Open (closing soon), Closed
// ========================

import { DateDisplay } from "./dateDisplay";

export interface PeriodDateProps {
  date: string | null | undefined;
  openDate: string | null | undefined;
  closeDate: string | null | undefined;
  format?:
    | "short"
    | "long"
    | "iso"
    | "numeric"
    | "weekday-short"
    | "weekday-long";
  nullText?: string;
  warningDays?: number; // Default: 30 days before close
  className?: string;
}

/**
 * Date display with color coding based on registration period status
 *
 * States:
 * 1. Before openDate → text-disabled (registration not open yet)
 * 2. Between open and close (safe) → text-info (registration open!)
 * 3. Between open and close (closing soon) → text-warning (hurry up!)
 * 4. After closeDate → text-error (registration closed)
 *
 * Usage:
 * <PeriodDate
 *   date={type.registrationOpenDate}
 *   openDate={type.registrationOpenDate}
 *   closeDate={type.registrationCloseDate}
 *   format="short"
 * />
 */
export function PeriodDate({
  date,
  openDate,
  closeDate,
  format = "short",
  nullText = "N/A",
  warningDays = 30,
  className = "",
}: PeriodDateProps) {
  // Get color class based on registration period status
  const colorClass = getPeriodColorClass(openDate, closeDate, warningDays);
  const combinedClassName = `${colorClass} ${className}`.trim();

  return (
    <DateDisplay
      date={date}
      format={format}
      nullText={nullText}
      className={combinedClassName}
    />
  );
}

/**
 * Get color class based on registration period status
 */
function getPeriodColorClass(
  openDate: string | null | undefined,
  closeDate: string | null | undefined,
  warningDays: number,
): string {
  // If either date is missing, use default color
  if (!openDate || !closeDate) {
    return "text-on-surface-variant";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const open = new Date(openDate);
  open.setHours(0, 0, 0, 0);

  const close = new Date(closeDate);
  close.setHours(0, 0, 0, 0);

  // 1. Not open yet (today < openDate)
  if (today < open) {
    return "text-disabled"; // Registration not open yet
  }

  // 2. Already closed (today > closeDate)
  if (today > close) {
    return "text-error"; // Registration closed
  }

  // 3. Open - check if within warning period
  const daysUntilClose = Math.ceil(
    (close.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilClose <= warningDays) {
    return "text-warning"; // Closing soon!
  }

  // 4. Open and plenty of time
  return "text-info"; // Registration open
}
