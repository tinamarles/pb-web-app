// === MODIFICATION LOG ===
// Date: 2025-12-25 UTC
// Modified by: Assistant
// Changes: Created universal DateDisplay component for all date formatting needs
// Purpose: Single component that handles nulls, formatting, and display logic
// Why: User has many optional date fields - this eliminates ?? '' everywhere!
// Formats: short, long, iso, numeric, weekday-short, weekday-long
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

// Helper: Format date based on format type
function formatDate(
  dateString: string,
  format: DateDisplayProps["format"]
): string {
  const date = new Date(dateString);

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
