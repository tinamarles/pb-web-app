import { Badge} from "./badge";
import { Icon } from "./icon";
import { cn } from "./utils";
import { getDayOfWeekOptions, DayOfWeekValue } from "@/lib/constants";

export interface RecurringDayIndicatorProps {
  days: DayOfWeekValue[];  // [1, 3, 5] for Mon, Wed, Fri
  className?: string;
}

export function RecurringDayIndicator({ days, className }: RecurringDayIndicatorProps) {

  const dayOptions = getDayOfWeekOptions();
  
  return (
    <div className={cn('flex gap-sm items-center', className)}>
        
        <div className="flex gap-sm items-center">
            {dayOptions.map(({ value, shortLabel }) => {
                const isActive = days.includes(value);
                return isActive ? (
                    <Badge
                        key={value}
                        variant='info'
                        label={shortLabel}
                        className="label-sm"
                    />
                ) : (
                    <span
                        key={value}
                        className="label-sm text-on-surface-variant"
                    >
                        {shortLabel}
                    </span>
                );
            })}
        </div>
    </div>
  );
}