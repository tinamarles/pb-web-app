// components/event/SessionCard.tsx
"use client";

import { Badge, Button, ButtonVariant, Icon, DateDisplay } from "@/ui";
import { Session } from "@/lib/definitions";
import {
  formatDate,
  formatTimeRange,
  isDateToday,
  isPastDate,
} from "@/lib/dateUtils";
import {
  LeagueAttendanceStatus,
  SessionActionType,
  SessionAction,
} from "@/lib/constants";
import { cn } from "@/ui/utils";

export interface SessionCardProps {
  session: Session;
  variant?: "default" | "today";
  isEvent: boolean; // true = Event (shows registration), false = League (no registration badge)
  userIsParticipant: boolean; // Is user enrolled in the league/event overall?
  userIsCaptain?: boolean;
  eventName?: string;
  onAction: (action: SessionActionType, sessionId: number) => void;
}

/**
 * SessionCard Component
 *
 * Displays a single session in the sessions carousel.
 *
 * **Visual Design (from user's image):**
 * - Date badge on left
 * - Session info (time, location, spots) in center
 * - Action buttons on right
 *
 * **Business Logic:**
 * - EVENTS: Show "Registration Open/Closed" + spots available
 * - LEAGUES: NO registration badge (participants auto-enrolled)
 *
 * **Actions:**
 * - EVENT + NOT enrolled: "Join" + "Players" buttons
 * - EVENT + Enrolled: "Players" + "Cancel" buttons
 * - LEAGUE + Participant: "Players" + "Cancel" buttons
 * - LEAGUE + NOT participant: "Players" button only
 */
export function SessionCard({
  session,
  variant = "default",
  isEvent,
  userIsParticipant,
  userIsCaptain = false,
  eventName = "Club Event",
  onAction,
}: SessionCardProps) {
  // Calculate spots information
  const spotsLeft = session.maxParticipants
    ? session.maxParticipants - session.participantsCount
    : null;

  const isFilled = spotsLeft === 0;

  const spotsText = isFilled
    ? "all spots filled"
    : spotsLeft === null
    ? null
    : spotsLeft === 1
    ? "1 spot available"
    : `${spotsLeft} spots available`;

  // Attendance status (integer from backend)
  const userIsAttending =
    session.userAttendanceStatus === LeagueAttendanceStatus.ATTENDING;

  const borderStyle = userIsCaptain ? "border-l-4 border-l-tertiary" : "";

  const sessionCardClasses = cn(
    variant === "today" && "session-card-today",
    variant === "default" && "session-card-default"
  );

  function getAvailableActions(): Array<{
    type: SessionActionType;
    label: string;
    variant: ButtonVariant;
    icon?: string;
    disabled?: boolean;
  }> {
    if (isPastDate(session.date)) {
      return [];
    }

    if (variant === "default") {
      if (userIsAttending) {
        return [
          {
            type: SessionAction.PLAYERS,
            label: "Players",
            variant: "outlined",
            icon: "members",
          },
          {
            type: SessionAction.CANCEL,
            label: "Cancel",
            variant: "error",
            icon: "close",
          },
        ];
      } else {
        if (isEvent) {
          return [
            {
              type: SessionAction.PLAYERS,
              label: "Players",
              variant: "outlined",
              icon: "members",
            },
            {
              type: SessionAction.JOIN,
              label: "Join",
              variant: "filled",
              icon: "add",
            },
          ];
        } else {
          return [
            {
              type: SessionAction.PLAYERS,
              label: "Players",
              variant: "outlined",
              icon: "members",
            },
          ];
        }
      }
    }

    if (variant === "today") {
      if (userIsCaptain) {
        return [
          {
            type: SessionAction.CHECK_IN,
            label: "Check-In",
            variant: "filled",
            icon: "success",
          },
          {
            type: SessionAction.MANAGE_ATTENDEES,
            label: "Manage",
            variant: "outlined",
            icon: "members",
          },
        ];
      } else {
        return [
          {
            type: SessionAction.MY_MATCHES,
            label: "My Matches",
            variant: "filled",
            icon: "matches",
          },
          {
            type: SessionAction.CANCEL,
            label: "Cancel",
            variant: "error",
            icon: "close",
          },
        ];
      }
    }

    return [];
  }

  function SessionCardActions({
    onAction,
  }: {
    onAction: (action: SessionActionType, sessionId: number) => void;
  }) {
    const actions = getAvailableActions();

    if (actions.length === 0) {
      return;
    }

    return (
      <div className="flex justify-between items-center px-md py-sm rounded-bl-md rounded-br-md">
        {actions.map((action) => (
          <Button
            key={action.type}
            variant={action.variant}
            icon={action.icon}
            label={action.label}
            disabled={action.disabled}
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // ✅ Stop here! Don't bubble to card!
              onAction(action.type, session.id); // Then call handler
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`session-card @sm/card:flex-row ${sessionCardClasses} ${borderStyle}`}>
      
        {/* Session Info */}
        <div className="flex flex-col flex-1 gap-xs p-md bg-secondary/20 text-on-surface justify-between">
          {/* Date  */}
          <div className="flex gap-sm items-center">
            <Icon name="calendar" size="md" />
            <DateDisplay
              date={session.date}
              format="weekday-short-noYear"
              className="title-md emphasized"
            />
          </div>
          {/* Time */}
          <div className="flex gap-sm items-center">
            <Icon name="clock" size="md" />
            <span className="single-line-base">
              {formatTimeRange(session.startTime, session.endTime)}
            </span>
          </div>

          {/* Location */}
          <div className="flex gap-sm items-center">
            <Icon name="location" size="md" />
            <span className="single-line-base">{session.courtInfo.name}</span>
          </div>
        </div>
        <div className="flex flex-col shrink-0">
          {variant === "today" && (
            <p className="px-sm pt-sm title-sm emphasized text-primary">{eventName}</p>
          )}
          {/* Session Participation */}
          <div className="flex flex-col gap-xs p-md">
            {/* Registration Status (EVENTS only) */}
            {isEvent && variant === "default" && (
              <div className="flex gap-sm items-center text-on-surface-variant">
                <Icon name="register" size="md" />
                {session.registrationOpen ? (
                  <Badge
                    variant="success"
                    label="Registration Open"
                    className="single-line-base w-fit"
                  />
                ) : (
                  <Badge
                    variant="default"
                    label="Registration Closed"
                    className="single-line-base w-fit"
                  />
                )}
              </div>
            )}

            {/* Spots Info */}
            <div className="flex gap-sm items-center text-on-surface-variant">
              <Icon name="members" size="md" />
              <p className="body-sm">
                {session.participantsCount} going
                {spotsText && ` · ${spotsText}`}
              </p>
            </div>
          </div>
          {/* Actions */}
          <SessionCardActions onAction={onAction} />
        </div>
      
    </div>
  );
}
