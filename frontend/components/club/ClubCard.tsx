"use client";
/**
The card component is (for the moment) called by the layout.tsx for the club/[clubId] route path. 

	<ClubCard club={club} actions={true} joinMode={isJoinMode}/>
The component returns a completely responsive Card that is shown on top of all Club Details tabs.
**/

import { getClubPermissions } from "@/lib/utils";
import { useAuth } from "@/providers/AuthUserProvider";
import { useDashboard } from "@/providers/DashboardProvider";
import { useSearchParams } from "next/navigation";
import { ResponsiveButton, Badge, Button } from "@/ui";
import Image from "next/image";
import { MemberClub } from "@/lib/definitions";
import { ClubType, getClubTypeLabel } from "@/lib/constants";
import { join } from "path";

export type ClubCardVariant = "grid-display" | "detail";

export interface ClubCardProps {
  club: MemberClub;
  actions?: boolean; // whether to show action buttons
  joinMode?: boolean; // whether in join mode (for non-members)
  variant?: ClubCardVariant;
  onClick?: () => void;
}

// ✅ OUTSIDE - pure calculation: Calculate sizes based on variant
const getImageSizes = (variant: ClubCardVariant): string => {
  switch (variant) {
    case "detail":
      return "100vw"; // Full width for detail page
    case "grid-display":
    default:
      return "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"; // Grid responsive
  }
};

// ✅ Helper for logo sizes based on variant
const getLogoSizes = (variant: ClubCardVariant): string => {
  switch (variant) {
    case "detail":
      return "(max-width: 639px) 64px, (max-width: 1023px) 128px, 256px";
    case "grid-display":
    default:
      return "(max-width: 639px) 64px, (max-width: 1023px) 64px, 64px";
  }
};

// ✅ Helper for logo CSS classes based on variant
const getLogoClasses = (variant: ClubCardVariant): string => {
  switch (variant) {
    case "detail":
      return "club-logo club-logo-bottom-left";
    case "grid-display":
    default:
      return "club-logo-grid";
  }
};

export function ClubCard({
  club,
  actions = true,
  joinMode,
  variant = "detail", // Default to detail layout
  onClick,
}: ClubCardProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  const { user } = useAuth();
  const { isMember, isAdmin } = getClubPermissions(user, club.id);
  const { setSelectedClub } = useDashboard();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  const isJoinMode = intent === "join";

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // Handle Click on Join Club
  const handleJoinClick = () => {
    console.log(`Joining club ${club.name}`);
    //TODO: need to implement join logic
  };

  // Handle click on Contact Club button
  const handleContactClick = () => {
    console.log(`Contacting club ${club.name}`);
    //TODO: needs to open a modal to send notification or email to club
  };

  // Handle click on Admin Dashboard button
  const handleAdminClick = () => {
    setSelectedClub(club.id);
  };

  // ========================================
  // Render Club Banner
  // ========================================
  const renderClubBanner = () => {
    return (
      <>
        <div className={`banner-container min-w-0 ${variant}`}>
          <Image
            src={
              club.bannerUrl ??
              "https://res.cloudinary.com/dvjri35p2/image/upload/v1768030839/default_blri8f.jpg"
            }
            alt={club.name}
            fill
            sizes={getImageSizes(variant)}
            className="object-cover"
          />

          {/* Show 'Private Group' Badge */}
          {club.clubType === ClubType.PERSONAL && (
            <Badge
              variant="secondary"
              label={getClubTypeLabel(club.clubType)}
              className={`card-badge card-badge-top-left ${variant} w-fit h-auto rounded-md`}
            />
          )}
          {/* Show 'Joined' Badge */}
          {isMember && (
            <Badge
              variant="tertiary"
              label="Joined"
              className={`card-badge card-badge-top-right ${variant} rounded-md w-fit h-auto`}
            />
          )}

          {/* Show Club Logo */}
          {club.logoUrl && (
            <div className={getLogoClasses(variant)}>
              {/* Uses variant to get classes */}
              <Image
                src={club.logoUrl}
                alt={club.name}
                fill
                sizes={getLogoSizes(variant)}
                className="object-cover"
              />
            </div>
          )}
        </div>
      </>
    );
  };

  // ========================================
  // Render Club Info
  // ========================================
  const renderClubInfo = () => {
    const memberLabel = club.memberCount === 1 ? "Member" : "Members";
    return (
      <div className={`card-content ${variant}`}>
        <h2 className={`club-name ${variant}`}>{club.name}</h2>
        <p className={`club-location ${variant}`}>{club.address?.city}</p>
        <p className={`club-members ${variant}`}>
          {club.memberCount} {memberLabel}
        </p>
        {!actions && !isMember && joinMode && (
          <Button
            size="sm"
            label="Join"
            icon="add"
            variant="outlined"
            onClick={handleJoinClick}
            className="w-fit absolute bottom-2 right-2 py-xs"
          />
        )}
      </div>
    );
  };

  // ========================================
  // Render Actions
  // ========================================
  const renderActions = () => (
    <div className="action-container">
      {/* Show Admin Button if user is admin only */}
      {isAdmin && (
        <ResponsiveButton
          mobile={{ size: "sm", label: "Admin", icon: "dashboard" }}
          desktop={{ size: "md", label: "Admin Dashboard", icon: "dashboard" }}
          variant="filled"
          onClick={handleAdminClick}
          href={`/admin/${club.id}/settings`}
        />
      )}
      {/* Show Contact Club Button */}
      <ResponsiveButton
        mobile={{ size: "sm", label: "Club", icon: "send" }}
        desktop={{ size: "md", label: "Message Club", icon: "send" }}
        variant="outlined"
        onClick={handleContactClick}
      />
      {/* Show Join Button only if user is NOT a member */}
      {!isMember && (
        <ResponsiveButton
          mobile={{ size: "sm", label: "Join", icon: "add" }}
          desktop={{ size: "md", label: "Join", icon: "add" }}
          variant="filled"
          onClick={handleJoinClick}
        />
      )}
    </div>
  );

  return (
    <div className={`club-card ${variant}`} onClick={onClick}>
      {renderClubBanner()}
      {renderClubInfo()}
      {actions && renderActions()}
    </div>
  );
}
