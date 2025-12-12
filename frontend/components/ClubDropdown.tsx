"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import { Avatar, Select, type SelectOption } from "@/ui";

export function ClubDropdown() {
  const { selectedClubId, setSelectedClub, currentMembership, memberships } =
    useDashboard();

  // If no memberships, don't render anything
  if (memberships.length === 0 || !currentMembership?.club) {
    return null;
  }

  // Create options array for Select
  const clubOptions: SelectOption<number>[] = memberships.map((m) => ({
    value: m.club.id!,
    label: m.club.shortName || m.club.name!, // Safe to use ! now after filter
    icon: (
      <Avatar
        src={m.club.logoUrl || undefined}
        name={m.club.name!}
        size="sm"
        className="rounded-none"
      />
    ),
  }));

  // Handle club selection
  const handleClubChange = (clubId: number) => {
    setSelectedClub(clubId);
    const selectedClub = memberships.find((m) => m.club.id === clubId)?.club;
    console.log("Selected club:", selectedClub?.shortName, "ID:", clubId);
  };

  // If only one club, show it without dropdown
  if (memberships.length === 1) {
    return (
      <div className="dashboard-dropdown">
        <Avatar
          src={currentMembership.club.logoUrl || undefined}
          name={currentMembership.club.name}
          size="sm"
          className="rounded-none"
        />
        <span className="body-sm truncate">
          {currentMembership.club.shortName || currentMembership.club.name}
        </span>
      </div>
    );
  }
  // Multiple clubs - show dropdown
  return (
    <div className="dashboard-select">
      <Select
        value={selectedClubId!}
        options={clubOptions}
        onChange={handleClubChange}
        triggerClassName="pr-sm bg-surface-container-highest rounded-sm"
      />
    </div>
  );
}
