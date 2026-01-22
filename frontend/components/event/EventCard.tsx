'use client';

import { Badge, Button, Avatar, Icon, DateDisplay, ButtonVariant, RecurringDayIndicator } from "@/ui";
import Image from "next/image";
import { Event, Tag, isRecurring } from "@/lib/definitions";
import { useAuth } from "@/providers/AuthUserProvider";
import { formatTimeRange } from "@/lib/dateUtils";
import { toNumber } from "@/lib/utils";
import { EventAction, EventActionType, EventCardModes, EventCardModeType, isDashboardMode } from "@/lib/constants";

export type EventCardVariant = "grid-display" | "grid-sidebar" | "detail";

export interface EventCardProps {
  event: Event;
  mode: EventCardModeType; // whether to show action buttons
  variant?: EventCardVariant;
  // Actions (optional - passed from parent )
  onAction: (action: EventActionType, event: Event, e?: React.MouseEvent) => void;
}

const getImageSizes = (variant: EventCardVariant): string => {
  switch (variant) {
    case "detail":
      return "100vw"; // Full width for detail page
    case "grid-display":
      return "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"; // Grid responsive
    case "grid-sidebar":
      return "(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"; // Grid responsive with sidebar
    default:
      return "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"; // Grid responsive
  }
};

export function EventCard({
  event,
  mode = EventCardModes.DASHBOARD_TODAY,
  variant = 'grid-display',
  onAction,
}: EventCardProps) {

    // ========================================
    // STATE & DATA
    // ========================================
    const { user } = useAuth();

    // Calculate Display values
    const spotsLeft = event.maxParticipants 
        ? event.maxParticipants - event.participantsCount
        : null;

    const isFilled = spotsLeft === 0;

    const spotsText = isFilled 
        ? 'all spots filled'
        : spotsLeft === null 
            ? null 
            : spotsLeft === 1 
            ? '1 spot available' 
            : `${spotsLeft} spots available`;
    
    // Price to display
    const fee = toNumber(event.fee);
    const displayPrice = event.userStatus?.calculatedPrice ?? fee
    const isFree = displayPrice === 0 || displayPrice === null;

    const borderStyle = event.userIsCaptain 
        ? 'border-l-4 border-l-tertiary'
        : ''

    const eventIsRecurring = isRecurring(event);

    // ========================================
    // EVENT HANDLERS
    // ========================================

    // ========================================
    // Render Event Header - either Club or Host
    // ========================================
    const renderHeader = () => {
        
        // depending on mode either show club_info or captain_info
        const avatar = mode === EventCardModes.ALL_EVENTS 
            ? event.clubInfo.logoUrl
            : event.captainInfo.profilePictureUrl

        const name = mode === EventCardModes.ALL_EVENTS
            ? event.clubInfo.name
            : event.captainInfo.fullName

        return (
            <div className="flex gap-md p-md items-center">
                <Avatar
                    src={avatar || undefined}
                    name={name}
                    size="sm"
                />
                <span className="title-md text-secondary">{name}</span>
            </div>
        )
    }
    // ========================================
    // Render Event Banner
    // ========================================
    const renderEventBanner = () => {
        
        return (
            <>
                <div className={`banner-container min-w-0 ${variant}`}>
                    <Image
                    src={
                        event.imageUrl ??
                        "https://res.cloudinary.com/dvjri35p2/image/upload/v1768917298/default_Event_g0c5xy.jpg"
                    }
                    alt={event.name}
                    fill
                    sizes={getImageSizes(variant)}
                    className="object-cover"
                    />
                </div>

                {/* Show 'Filled' Badge */}
                {isFilled && (
                <Badge
                    variant="tertiary"
                    label='Filled'
                    className={`card-badge card-badge-top-left ${variant} w-fit h-auto rounded-md`}
                />
                )}
            </>
        );
    };

    // ========================================
    // Render Tags
    // ========================================

    function RenderTags({ tags }: { tags?: Tag[] }) {
        if (!tags || tags.length === 0) {
            return null; // No tags? Show nothing!
        }

        // Only show 2-3 tags to avoid clutter
        const displayTags = tags.slice(0,3);

        // Badge needs to be able to show the tag.color somehow!
        return (
            <div className="flex gap-xs p-md flex-wrap">
                {displayTags.map(tag => (
                    <Badge 
                        key={tag.id} 
                        variant='default' 
                        size='default'
                        label={tag.name}
                    />
                ))}
            </div>
        )
    }

    // ========================================
    // Render Event Info
    // ========================================

    const renderEventInfo = () => {

        return (
            <div className="flex flex-col p-md gap-sm">
                {/* Event Title */}
                <p className="title-md emphasized">{event.name}</p>
                {/* Recurring Days Bar */}
                {eventIsRecurring && (
                    <RecurringDayIndicator days={event.recurringDays} />
                )}
                {/* Event Date and time */}
                <div className="flex gap-sm items-center text-on-surface-variant">
                    <Icon name='calendar' size="md" />
                    <DateDisplay date={event.nextOccurrence?.date} format="short" className="body-sm"/>
                    <p className="body-sm">{formatTimeRange(event.nextOccurrence?.startTime, event.nextOccurrence?.endTime)}</p>
                </div>
                {/* Event Location */}
                <div className="flex gap-sm items-center text-on-surface-variant">
                    <Icon name='location' size="md" />
                    <p className="body-sm">{event.nextOccurrence?.locationName}</p>
                </div>
                {/* Available Spots */}
                <div className="flex gap-sm items-center text-on-surface-variant">
                    <Icon name='members' size='md' />
                    <p className="body-sm">
                        {event.participantsCount} going
                        {spotsText && ` · ${spotsText}`}
                    </p>
                </div>

                {/* Fee */}
                <p className="title-md emphasized">
                    {isFree ? 'FREE' : `$${displayPrice.toFixed(2)}`}
                </p>
            </div>
        )
    }

    // ========================================
    // Render Event Card Actions
    // ========================================

    function getAvailableActions (
        mode: EventCardModeType,
        event: Event
    ): Array<{type: EventActionType; label: string; variant: ButtonVariant; icon?: string; disabled?: boolean}> {

        // ========================================
        // DASHBOARD - TODAY'S ACTIVITIES
        // ========================================
        if (mode === EventCardModes.DASHBOARD_TODAY) {
            // Captain sees different buttons than participants!
            if (event.userIsCaptain) {
                return [
                    { type: EventAction.CHECK_IN, label: 'Check-In', variant: 'filled', icon: 'success' },
                    { type: EventAction.MANAGE_ATTENDEES, label: 'Attendees', variant: 'outlined', icon: 'members' }
                ];
                // Returns ARRAY with 2 buttons! 👆
            }

            if (event.userIsParticipant) {
                return [
                    { type: EventAction.MY_MATCHES, label: 'My Matches', variant: 'filled', icon: 'show' },
                    { type: EventAction.MESSAGE_HOST, label: 'Message Host', variant: 'outlined', icon: 'send' }
                ];
            }

            return []; // no button
        } 

        // ========================================
        // DASHBOARD - UPCOMING EVENTS
        // ========================================
        if (mode === EventCardModes.DASHBOARD_UPCOMING) {
            // Captain sees different buttons than participants!
            if (event.userIsCaptain) {
                return [
                    { type: EventAction.CHECK_IN, label: 'Check-In', variant: 'filled', icon: 'success', disabled: true },
                    { type: EventAction.MANAGE_ATTENDEES, label: 'Attendees', icon: 'members', variant: 'outlined' }
                ];
                // Returns ARRAY with 2 buttons! 👆
            }

            if (event.userIsParticipant) {
                return [
                    { type: EventAction.CANCEL, label: 'Cancel', variant: 'error', icon: 'close' },
                    { type: EventAction.MESSAGE_HOST, label: 'Message Host', variant: 'outlined', icon: 'send' }
                ];
            }

            return [
                { type: EventAction.JOIN, label: 'Join', variant: 'filled', icon: 'add' },
                { type: EventAction.MESSAGE_HOST, label: 'Message Host', variant: 'outlined', icon: 'send' }
            ]; 
        } 

        // ========================================
        // CLUB DETAILS - HOME TAB
        // ========================================
        if (mode === EventCardModes.CLUB_HOME) {
            return [];
        }

        // ========================================
        // CLUB DETAILS - EVENTS TAB
        // ========================================
        if (mode === EventCardModes.CLUB_EVENTS) {
            
            console.log('Event Card: Event: ', event);
            // User is not authorized
            if (!user) {
                return [
                    { type: EventAction.VIEW_DETAILS, label: 'View Details', variant: 'filled', icon: 'show' }
                ];
            }

            // Captain sees different buttons than participants!
            if (event.userIsCaptain) {
                return [
                    { type: EventAction.CHECK_IN, label: 'Check-In', variant: 'filled', icon: 'success', disabled: true },
                    { type: EventAction.MANAGE_ATTENDEES, label: 'Attendees', icon: 'members', variant: 'outlined' }
                ];
                // Returns ARRAY with 2 buttons! 👆
            }

            if (event.userIsParticipant) {
                return [
                    { type: EventAction.CANCEL, label: 'Cancel', variant: 'error', icon: 'close' },
                    { type: EventAction.MESSAGE_HOST, label: 'Message Host', variant: 'outlined', icon: 'send' }
                ];
            }

            return [
                { type: EventAction.JOIN, label: 'Join', variant: 'filled', icon: 'add' },
                { type: EventAction.MESSAGE_HOST, label: 'Message Host', variant: 'outlined', icon: 'send' }
            ]; 

        }

        // default fallback: no buttons
        return [];
    } 
    
    function EventCardActions({
        mode,
        event,
        onAction
    }: EventCardProps) {

        // Determine if to show ACTION/MANAGE EVENT TITLE to display
        const title = isDashboardMode(mode)
            ? (event.userIsCaptain ? 'MANAGE EVENT' : 'ACTIONS')
            : null;

        const actions = getAvailableActions(mode, event);
        
        if (actions.length === 0) {
            return;
        } 

        return (
            <div className='flex flex-col gap-sm p-md'>
                {title && (
                    <p className="single-line-small">{title}</p>
                )}
                {/* Show the Buttons */}
                <div className="flex justify-between items-center py-sm">
                    {actions.map(action => (
                        <Button
                            key={action.type}
                            variant={action.variant}
                            icon={action.icon}
                            label={action.label}
                            disabled={action.disabled}
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();  // ✅ Stop here! Don't bubble to card!
                                onAction(action.type, event, e);  // Then call handler
                            }}
                        />
                    ))}
                </div>

            </div>
        );
    }

    // ========================================
    // RENDER EVENT CARD
    // ========================================
    return (
        <div className={`event-card ${variant} ${borderStyle}`} onClick={() => onAction('VIEW_DETAILS', event)}>
            {renderHeader()}
            {renderEventBanner()}
            <RenderTags tags={event.tags} />
            {renderEventInfo()}
            <EventCardActions mode={mode} event={event} onAction={onAction} />
        </div>
    );
}