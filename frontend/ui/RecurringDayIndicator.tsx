import { Badge} from "./badge";
import { Icon } from "./icon";
import { cn } from "./utils";
import { getDayOfWeekOptions, DayOfWeekValue } from "@/lib/constants";

export interface RecurringDayIndicatorProps {
  days: DayOfWeekValue[];  // [1, 3, 5] for Mon, Wed, Fri
  variant?: 'small' | 'large' | 'responsive';
  className?: string;
}

export function RecurringDayIndicator({ days, className, variant = 'small' }: RecurringDayIndicatorProps) {

  const dayOptions = getDayOfWeekOptions();

  const badgeClasses = cn(

    variant === "small" && "label-sm",
    variant === "large" && "single-line-medium py-sm h-fit",
    variant === "responsive" && "recurring-day-badge",
    className
  )

  const textClasses = cn(
    variant === "small" && "label-sm",
    variant === "large" && "single-line-medium",
    variant === "responsive" && "recurring-day-label",
  )

  return (
    <div className={cn('flex gap-sm items-center', className)}>
        
        <div className={cn('flex gap-sm items-center', className)}>
            {dayOptions.map(({ value, shortLabel }) => {
                const isActive = days.includes(value);
                return isActive ? (
                    <Badge
                        key={value}
                        variant='info'
                        label={shortLabel}
                        className={`${badgeClasses} w-fit h-fit`}
                    />
                ) : (
                    <span
                        key={value}
                        className={`${textClasses} text-on-surface-variant` }
                    >
                        {shortLabel}
                    </span>
                );
            })}
        </div>
    </div>
  );
}