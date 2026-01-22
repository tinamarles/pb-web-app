// === MODIFICATION LOG ===
// Date: 2026-01-22 UTC
// Modified by: Assistant
// Changes: Fixed date parsing to use LOCAL timezone instead of UTC
// Why: new Date("2026-01-23") treats string as UTC midnight, causing timezone bugs!
//      Now using parseLocalDate() helper to parse "YYYY-MM-DD" in user's local timezone
// Previous: Used new Date(dateString) - broke for users in timezones behind UTC (showed previous day!)
// Bug: Frontend showed "Fri, Jan 22" for "2026-01-23" - off by one day!
// ========================

export interface DateDisplayProps {
  date: string | null | undefined;
  format?:
    | "short"
    | "long"
    | "iso"
    | "numeric"
    | "weekday-short"
    | "weekday-long";
  nullText?: string;
  className?: string;
}

/**
 * Universal date display component
 *
 * Formats:
 * - 'short': Dec 25, 2024
 * - 'long': December 25, 2024
 * - 'iso': 2024-12-25
 * - 'numeric': 12/25/2024
 * - 'weekday-short': Wed, Dec 25, 2024
 * - 'weekday-long': Wednesday, December 25, 2024
 *
 * Usage:
 * <DateDisplay date={membership.registrationEndDate} format="short" />
 * <DateDisplay date={membership.registrationEndDate} format="iso" nullText="No expiry" />
 */
export function DateDisplay({
  date,
  format = "short",
  nullText = "N/A",
  className,
}: DateDisplayProps) {
  // Handle null/undefined - NO MORE ?? IN PARENT COMPONENTS!
  if (!date) {
    return <span className={className}>{nullText}</span>;
  }

  const formattedDate = formatDate(date, format);

  return <span className={className}>{formattedDate}</span>;
}

// Helper: Parse "YYYY-MM-DD" in LOCAL timezone (not UTC!)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // month is 0-indexed in JavaScript Date!
  return new Date(year, month - 1, day);
}

// Helper: Format date based on format type
function formatDate(
  dateString: string,
  format: DateDisplayProps["format"]
): string {
  // ✅ Parse in local timezone (not UTC!)
  const date = parseLocalDate(dateString);

  switch (format) {
    case "short":
      // Dec 25, 2024
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    case "long":
      // December 25, 2024
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    case "iso":
      // 2024-12-25
      return date.toISOString().split("T")[0];

    case "numeric":
      // 12/25/2024
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    case "weekday-short":
      // Wed, Dec 25, 2024
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    case "weekday-long":
      // Wednesday, December 25, 2024
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    default:
      return date.toLocaleDateString("en-US");
  }
}