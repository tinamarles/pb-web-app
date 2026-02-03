// components/event/SessionCarousel.tsx
'use client';

import { useState } from "react";
import { Session } from "@/lib/definitions";
import { SessionCard } from "./SessionCard";
import { PlayersModal } from "./PlayersModal";
import { SessionAction, SessionActionType } from "@/lib/constants";

export interface SessionCarouselProps {
  sessions: Session[];  // Array of upcoming sessions
  isEvent: boolean;     // true = Event (shows registration), false = League (no registration)
  userIsParticipant: boolean;  // Is user enrolled in the league/event overall?
  onAction: (action: SessionActionType, sessionId: number) => void;  // Same handler as SessionCard!
}

/**
 * SessionCarousel Component
 * 
 * Horizontal scrolling carousel of session cards.
 * 
 * **Usage:**
 * - Event/League detail page shows this at bottom
 * - User scrolls horizontally through upcoming sessions
 * - Can join/cancel individual sessions (for events)
 * - Can view players attending each session
 * 
 * **Data Source:**
 * - event.upcomingSessions[] from EventDetailSerializer
 * - Each session has: id, date, time, location, participantsCount, userAttendanceStatus, registrationOpen, maxParticipants
 * 
 * **Actions:**
 * - All actions handled by parent (EventDetailsClientPage)
 * - Modal state managed here (Players modal only)
 */
export function SessionCarousel({
  sessions,
  isEvent,
  userIsParticipant,
  onAction,
}: SessionCarouselProps) {

  // State for Players modal
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);

  // Handle session actions (wrap to intercept 'players' action for modal)
  const handleSessionAction = (
    action: SessionActionType,
    sessionId: number
  ) => {
    // Intercept 'players' action to open modal
    if (action === SessionAction.PLAYERS) {
      setSelectedSessionId(sessionId);
      setIsPlayersModalOpen(true);
      return;
    }
    
    // Pass all other actions up to parent
    onAction(action, sessionId);
  };

  return (
    <>
      <div className="sessions-carousel-container">
        {/* Header */}
        <div className="flex justify-between items-center mb-md">
          <h2 className="title-lg text-on-surface">Upcoming Sessions</h2>
          <span className="body-sm text-on-surface-variant">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="sessions-carousel">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isEvent={isEvent}
              userIsParticipant={userIsParticipant}
              onAction={handleSessionAction}
            />
          ))}
        </div>
      </div>

      {/* Players Modal */}
      {selectedSessionId && (
        <PlayersModal
          sessionId={selectedSessionId}
          isOpen={isPlayersModalOpen}
          onClose={() => {
            setIsPlayersModalOpen(false);
            setSelectedSessionId(null);
          }}
        />
      )}
    </>
  );
}