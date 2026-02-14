'use client';

/**
 * 1. IMPORTS
 */

import { 
    ActivityCardVariant,
    ActivityCardVariantValue,
    ActivityTypeValue,
    ActivityType
} from '@/lib/constants';
import { formatTimeRange } from '@/lib/dateUtils';
import { EventCardType } from '@/lib/definitions';
import { calculateDuration } from '@/lib/calendarUtils';
import { Icon, Avatar, ProgressBar, Badge } from '@/ui';

/**
 * 2. TYPES (including Props)
 */

interface ActivityCardProps {
  variant: ActivityCardVariantValue;
  activity: EventCardType;
  onAction: (
    activity: EventCardType,
) => void;
}

/**
 * 3. OUTSIDE FUNCTIONS (utilities)
 * 
 * These are functions that do not need component state;
 * They can be reused and tested independently
 */

/**
 * 4. FUNCTION DECLARATION
 */

export function ActivityCard({
    variant = ActivityCardVariant.DEFAULT,
    activity,
    onAction,
}: ActivityCardProps) {

    /**
     * 5. DATA & STATE (if client component)
     */
    const timeRange = formatTimeRange(activity.sessionInfo?.startTime, activity.sessionInfo?.endTime);
    const duration = calculateDuration(activity.sessionInfo?.startTime, activity.sessionInfo?.endTime);
    const durationText = `${duration} min`
    const spots =activity.sessionInfo?.maxParticipants ? activity.sessionInfo?.maxParticipants - activity.sessionInfo?.participantsCount : null;
    const spotsText = spots === null ? null : spots === 1 ? "1 spot left" : `${spots} spots left`;
    const locationText = activity.sessionInfo?.courtNumber ? `${activity.sessionInfo?.courtInfo.name} - court: ${activity.sessionInfo?.courtNumber}`: `${activity.sessionInfo?.courtInfo.name}`;
    const borderStyle = activity.type === ActivityType.BOOKING ? "border-l-4 border-l-info" : activity.eventInfo?.userIsCaptain ? "border-l-4 border-l-tertiary" : "";
   
    /**
     * 6. EFFECTS (if client component)
     */

    /**
     * 7. HANDLERS
     */

    /**
     * 8. FUNCTIONS & COMPONENTS
     */

    const renderTimestamps = () => {
        return (
            <div className='flex gap-sm grow shrink-0'>
                <Icon 
                    name="clock" 
                    size="md" 
                    className="mt-xs text-primary"
                />
                <div className='activity-card-time'>
                    <p className='text-primary'>{timeRange}</p>
                    <p className='activity-card-duration'>{durationText}</p>
                </div>
            </div>
        );
    };

    const renderActivityDetails = () => {
        return (
            // Event Detail
            <div className='flex flex-col gap-sm w-full'> 
            {/* EventInfo */}
                <div className='flex items-center justify-between'>
                    {/* ClubEvent */}
                    <div className='flex gap-sm'>
                        {/* Avatar only on mobile */}
                        <div className='activity-card-avatar-mobile'>
                            <Avatar
                                src={activity.eventInfo.avatarUrl}
                                name={activity.eventInfo.avatarName}
                                size='sm'
                            />
                        </div>
                        {/* EventDetail */}
                        <div className='flex flex-col flex-1'>
                            <p className='title-sm emphasized md:title-lg'>{activity.eventInfo.name}</p>
                            <p className='label-sm text-on-surface-variant md:body-md'>{locationText}</p>
                        </div>

                    </div>
                    {/* Spots  */}
                    <div className='flex flex-col gap-sm shrink-0'>
                        <p className='label-sm md:body-sm text-primary emphasized'>{spotsText}</p>

                    
                    {activity.sessionInfo?.maxParticipants != null && 
                    activity.sessionInfo?.participantsCount != null && (
                        <ProgressBar
                            value={activity.sessionInfo?.participantsCount}
                            max={activity.sessionInfo?.maxParticipants}
                            colorByPercentage={false}
                            className=''
                            fillClassName='success'
                            reverse={true}
                        />
                        )}
                    </div>
                </div>
            {/* EventTags */}
            {activity.eventInfo.tags && (
                <div className='flex gap-sm flex-wrap'>
                    {activity.eventInfo.tags.map((tag, index) => ( 
                        <Badge
                            key={index}
                            variant={tag.color}
                            label={tag.name}
                            className='rounded-md w-fit h-auto'
                        />
                    ))}
                </div>
            )}
            </div>
        );
    };

    /**
     * 9. RENDER Activity Card
     */
     return (
        <>
            {variant === ActivityCardVariant.DEFAULT && (
                <div
                    className={`activity-card ${borderStyle}`}
                    onClick={() => onAction(activity)}
                >
                {renderTimestamps()}
                <div className='activity-card-avatar-desktop'>
                    <Avatar
                        src={activity.eventInfo.avatarUrl}
                        name={activity.eventInfo.avatarName}
                        size='lg'
                        className='border border-secondary shadow-sm shadow-secondary'
                    />
                </div>
                {renderActivityDetails()}
                </div>
            )}
            {variant === ActivityCardVariant.CALENDAR && (
                <div 
                    className={`activity-card calendar ${borderStyle}`} 
                    onClick={() => onAction(activity)}
                >
                    <p className="label-sm">{timeRange}</p>
                    <div className='flex items-center gap-sm'>
                        <Avatar
                            src={activity.eventInfo.avatarUrl}
                            name={activity.eventInfo.avatarName}
                            size='xs'
                        />
                        <p className="label-lg">{activity.eventInfo.name}</p>
                    </div>
                    
                    <p className="label-sm">{locationText}</p>
                    {/* Spots  */}
                    <div className='flex flex-col gap-sm shrink-0'>
                        <p className='label-sm text-primary emphasized'>{spotsText}</p>
                        {activity.sessionInfo?.maxParticipants != null && 
                        activity.sessionInfo?.participantsCount != null && (
                            <ProgressBar
                                value={activity.sessionInfo?.participantsCount}
                                max={activity.sessionInfo?.maxParticipants}
                                colorByPercentage={false}
                                className='max-w-2/3'
                                fillClassName='success'
                                reverse={true}
                            />
                        )}
                    </div>
                    {activity.eventInfo.tags && (
                        <Badge
                            variant={activity.eventInfo.tags[0].color}
                            label={activity.eventInfo.tags[0].name}
                            className='rounded-sm label-sm h-auto w-fit max-w-full'
                        />
                    )}
              </div>
            )}
        </>
      );
     
}