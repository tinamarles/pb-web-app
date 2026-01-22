"use client";
// === MODIFICATION LOG ===
// Date: 2026-01-04
// Created by: Assistant
// Purpose: Client component for displaying club list with join mode filtering
// ========================
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { MemberClub, MemberUser } from "@/lib/definitions";
import { Button} from "@/ui";
import { EmptyState } from "../EmptyState";
import { ClubCard } from "./ClubCard";

interface ClubListClientProps {
  clubs: MemberClub[];
  isJoinMode: boolean;
}

export function ClubListClient({ clubs, isJoinMode }: ClubListClientProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const { user, isMemberUser } = useAuth();
  const [selectedClub, setSelectedClub] = useState<MemberClub | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // 🎯 Filter clubs in join mode - exclude clubs user is already a member of
  const memberships = isMemberUser ? (user as MemberUser).clubMemberships : [];
  const memberClubIds = memberships.map((m) => m.club.id);
  
  const clubsToList = isJoinMode
    ? clubs.filter((club) => !memberClubIds.includes(club.id))
    : clubs;
  
  const clubsAvailable = clubsToList.length > 0;

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // 🎯 Handle card click - navigate to details
  const handleCardClick = (clubId: number) => {
    const url = isJoinMode
      ? `/club/${clubId}/home?intent=join`
      : `/club/${clubId}/home`;
    router.push(url);
  };

  // 🎯 Handle join button - open confirmation dialog
  const handleJoinClick = (e: React.MouseEvent, club: MemberClub) => {
    e.stopPropagation(); // Prevent card click
    setSelectedClub(club);
  };

  // 🎯 Confirm join
  const handleConfirmJoin = async () => {
    if (!selectedClub) return;

    setIsJoining(true);
    try {
      // TODO: API call to join club
      // await post(`clubs/${selectedClub.clubId}/join`, {});

      // Refresh page to update list
      router.refresh();
      setSelectedClub(null);
    } catch (error) {
      console.error("Failed to join club:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // 🎯 Cancel join
  const handleCancelJoin = () => {
    setSelectedClub(null);
  };

  // ========================================
  // ClubList
  // ========================================
  function ClubList() {
    console.log("clubs:", clubsToList);
    const imageUrl =
      "https://res.cloudinary.com/dvjri35p2/image/upload/v1768051542/ClubListHeader_awq942.jpg";

    return (
      <div className="container p-0 mx-auto">
        {/* Show Header */}
        <div className="container relative p-0 ">
          <div
            className="clubList-Header"
            style={{
              backgroundImage: `url("${imageUrl}")`,
            }}
          ></div>
          <h1 className="clubList-Header-text">
            {`${isJoinMode ? "Select a club to join" : "Browse all our clubs"}`}
          </h1>
          <div className="clubList-search"></div>
        </div>
        {/* Action buttons */}
        <div className="flex justify-between items-center border-b border-outline-variant">
          <div className="flex flex-1">
            <p className="body-md text-info">
              Click a card to view more Information about the club.
            </p>
          </div>

          <div className="flex gap-md pb-sm justify-end">
            <Button
              variant="default"
              size="sm"
              icon="add"
              label="Create a Club"
            />
          </div>
        </div>

        {/* Show Club Cards */}
        <div className="clubList-container grid-3 xl:grid-cols-4">
          {clubsToList.map((club) => (
            
            <ClubCard
              key={club.id}
              club={club}
              actions={false}
              joinMode={isJoinMode}
              variant="grid-display"
              onClick={() => handleCardClick(club.id)}
            />
          ))}
        </div>
      </div>
    );
  }
  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      {clubsAvailable ? (
        <ClubList />
      ) : (
        <EmptyState
          icon="clubs"
          title="No Clubs to show!"
          description={`${
            isJoinMode
              ? "You are already a member of all available clubs!"
              : "No clubs available yet!"
          }`}
          className="text-on-surface bg-surface-container-lowest rounded-md"
          actionLabel="Create a club"
          actionIcon="add"
          href="/club/create"
        />
      )}
    </>
  );
}
