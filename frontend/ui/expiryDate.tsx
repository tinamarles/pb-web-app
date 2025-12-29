// === MODIFICATION LOG ===
// Date: 2025-12-25 UTC
// Modified by: Assistant
// Changes: Created ExpiryDate component - DateDisplay with color coding based on time remaining
// Purpose: Specialized date component that changes color based on expiry status
// Why: Common pattern for membership expiry, subscription expiry, etc.
// ========================

import { DateDisplay } from "./dateDisplay";

export interface ExpiryDateProps {
  date: string | null | undefined;
  format?:
    | "short"
    | "long"
    | "iso"
    | "numeric"
    | "weekday-short"
    | "weekday-long";
  nullText?: string;
  warningDays?: number; // Default: 30 days
  className?: string;
}

/**
 * Date display with color coding based on time remaining
 *
 * Colors:
 * - Expired (past date): text-error
 * - Within warning period (default 30 days): text-warning
 * - Safe (more than warning period): text-on-surface-variant
 *
 * Usage:
 * <ExpiryDate date={membership.registrationEndDate} format="short" />
 * <ExpiryDate date={subscription.expiryDate} warningDays={14} nullText="Never expires" />
 */
export function ExpiryDate({
  date,
  format = "short",
  nullText = "N/A",
  warningDays = 30,
  className = "",
}: ExpiryDateProps) {
  // Get color class based on expiry status
  const colorClass = getExpiryColorClass(date, warningDays);
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

// Helper: Get color class based on days until expiry
function getExpiryColorClass(
  expiryDate: string | null | undefined,
  warningDays: number
): string {
  if (!expiryDate) {
    return "text-on-surface-variant";
  }

  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    // Expired
    return "text-error";
  } else if (daysUntilExpiry <= warningDays) {
    // Within warning period
    return "text-warning";
  } else {
    // Safe
    return "text-on-surface-variant";
  }
}
