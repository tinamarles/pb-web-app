// components/event/PlayersModal.tsx
'use client';

import { useEffect, useState } from "react";
import { Avatar, Badge, Modal } from "@/ui";
import { getSessionParticipantsClient } from "@/lib/clientActions";
import { UserDetail} from "@/lib/definitions";

export interface PlayersModalProps {
  sessionId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PlayersModal Component
 * 
 * Shows list of participants for a specific session.
 * 
 * **Data Fetching:**
 * - Fetches from: `/api/sessions/${sessionId}/participants`
 * - Returns: Array of user objects with firstName, lastName, profilePictureUrl, skillLevel
 * 
 * **Display:**
 * - Avatar + Full Name + Skill Level badge
 * - Simple list view in a modal
 * 
 * **Future Enhancement:**
 * - If user is captain: Show admin features (TBD)
 */
export function PlayersModal({
  sessionId,
  isOpen,
  onClose,
}: PlayersModalProps) {

  const [participants, setParticipants] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch participants when modal opens
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const fetchParticipants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // const response = await fetch(`/api/sessions/${sessionId}/participants`);
        const response = await getSessionParticipantsClient(
            sessionId
        )

        setParticipants(response.participants);
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError('Failed to load participants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [sessionId, isOpen]);

  return (
    <Modal 
      open={isOpen} 
      onOpenChange={onClose}
      title="Session Participants"
      variant="default"
      showCloseButton={true}
    >
      <div className="players-list">
        {isLoading && (
          <div className="empty-state">
            <p className="body-md text-on-surface-variant">Loading...</p>
          </div>
        )}

        {error && (
          <div className="empty-state">
            <p className="body-md text-error">{error}</p>
          </div>
        )}

        {!isLoading && !error && participants.length === 0 && (
          <div className="empty-state">
            <p className="body-md text-on-surface-variant">
              No participants yet
            </p>
          </div>
        )}

        {!isLoading && !error && participants.length > 0 && (
          <>
            {participants.map((participant) => (
              <div 
                key={participant.id}
                className="flex items-center gap-md p-0"
              >
                <Avatar
                  src={participant.profilePictureUrl || undefined}
                  name={participant.fullName}
                  size="md"
                />
                
                <div className="flex-1 min-w-0">
                  <p className="body-md text-on-surface truncate">
                    {participant.firstName} {participant.lastName} 
                  </p>
                </div>

                {participant.skillLevel !== null && (
                  <Badge 
                    variant="secondary" 
                    label={`${participant.skillLevel}`} 
                    className="w-fit py-xs h-fit"/>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
}