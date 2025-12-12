'use client';

import { useDashboard } from "@/providers/DashboardProvider";
import { Avatar, RadioButton, Icon, Sheet } from "@/ui";

interface ClubSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClubSwitcherModal({ isOpen, onClose }: ClubSwitcherModalProps) {
  const { selectedClubId, setSelectedClub, memberships } = useDashboard();

  const handleClubChange = (clubId: number) => {
    setSelectedClub(clubId);
    onClose(); // Close modal after selection
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={onClose}
      title="Switch Club"
    >
      <div className="flex flex-col gap-4">
        {memberships.map((membership) => {
          const isSelected = membership.club.id === selectedClubId;
          const isPreferred = membership.isPreferredClub;

          return (
            <button
              key={membership.club.id}
              onClick={() => membership.club.id && handleClubChange(membership.club.id)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors"
            >
              {/* Radio Button */}
              <RadioButton
                checked={isSelected}
                onChange={() => membership.club.id && handleClubChange(membership.club.id)}
                name="club-selection"
              />

              {/* Club Avatar */}
              <Avatar
                src={membership.club.logoUrl}
                name={membership.club.name}
                size="md"
              />

              {/* Club Name */}
              <span className="body-lg flex-1 text-left">
                {membership.club.shortName}
              </span>

              {/* Preferred Star */}
              {isPreferred && (
                <Icon name="star" className="text-tertiary fill-tertiary" />
              )}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}