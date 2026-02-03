/**
 * ProgressBar Component
 *
 * A simple progress bar for showing capacity/completion status.
 * Uses CSS variables from globals.css for styling.
 *
 * Used in:
 * - Activity cards (showing event capacity: "X spots left")
 *
 * Features:
 * - Customizable height via CSS class
 * - Automatic color changes based on fill percentage (optional)
 * - Smooth animations
 */

interface ProgressBarProps {
  /**
   * Current value (e.g., number of participants)
   */
  value: number;

  /**
   * Maximum value (e.g., max participants)
   */
  max: number;

  /**
   * Show color based on fill percentage
   * - green: < 70%
   * - yellow: 70-90%
   * - red: > 90%
   */
  colorByPercentage?: boolean;

  /**
   * Custom CSS class for the container
   */
  className?: string;

  /**
   * Custom CSS class for the fill bar
   */
  fillClassName?: string;
}

export function ProgressBar({
  value,
  max,
  colorByPercentage = false,
  className = "",
  fillClassName = "",
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  // Determine color class if colorByPercentage is enabled
  let colorClass = "bg-primary";
  if (colorByPercentage) {
    if (percentage >= 90) {
      colorClass = "bg-error";
    } else if (percentage >= 70) {
      colorClass = "bg-warning";
    } else {
      colorClass = "bg-success";
    }
  }

  return (
    <div
      className={`progress-bar ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`progress-bar-fill ${colorClass} ${fillClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
