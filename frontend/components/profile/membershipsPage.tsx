"use client";
import { EmptyState } from "@/components";
import { useAuth } from "@/providers/AuthUserProvider";
import { useState } from "react";
import { type MemberUser, type ClubMembership } from "@/lib/definitions";
import {
  Avatar,
  Button,
  Icon,
  Badge,
  Sheet,
  RadioButton,
  ExpiryDate,
} from "@/ui";
import { MembershipStatusBadge } from "@/components";
import {
  RoleTypeLabels,
  RoleBadgeVariants,
  RoleType,
  SkillLevelLabels,
  SkillLevelBadgeVariant,
} from "@/lib/constants";
import {
  getMembershipBadgeVariant,
  getMembershipNotificationInfo,
} from "@/lib/badgeUtils";
import {
  formatDate,
  isWithinDateRange,
  isPastDateCheck,
} from "@/lib/dateUtils";

interface Subscription {
  id: number;
  name: string;
  fee: number;
  billingFrequency: "monthly" | "one-time-payment";
  nextBillingDate?: string | null;
  discount?: number | null;
  limitedUses?: number | null;
  usesLeft?: number | null;
  purchasedDate: string;
}

export function MembershipsPage() {
  // ========================================
  // STATE & DATA
  // ========================================
  const { notifications } = useAuth();
  const { user, isMemberUser } = useAuth();
  const [selectedMembershipId, setSelectedMembershipId] = useState<
    number | null
  >(null);

  // Check if AuthProvider has loaded user yet
  if (!user) {
    return (
      <div className="container mx-auto min-w-1/2 bg-surface-container-highest p-md rounded-md border border-outline">
        <p className="title-md emphasized">Loading memberships...</p>
      </div>
    );
  }

  // Get all memberships
  const memberships = isMemberUser ? (user as MemberUser).clubMemberships : [];

  const hasMemberships = memberships.length > 0;

  // Select the first membership by default
  let selectedMembership = null;

  if (hasMemberships) {
    selectedMembership = selectedMembershipId
      ? memberships.find((m) => m.id === selectedMembershipId)
      : memberships[0];
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // Handle if the user card clicks on a membership card
  const handleSelectMembership = (id: number) => {
    setSelectedMembershipId(id);
  };

  const handleCloseMembership = () => {
    setSelectedMembershipId(null);
  };

  const handleSetPreferred = async (membershipID: number) => {
    try {
      // TODO: Call API to update preferred club
      // await updatePreferredClub(membershipId);

      console.log("Setting preferred club:", membershipID);

      // TODO: Update local state or refetch user data
      // This should trigger a re-render of the memberships list
    } catch (error) {
      console.error("Failed to set preferred club:", error);
    }
  };

  // ========================================
  // MEMBERSHIPS LIST (INSIDE - has access to memberships & notifications!)
  // ========================================
  function MembershipsList({
    selectedMembershipId,
    onSelect,
  }: {
    selectedMembershipId: number | null;
    onSelect: (id: number) => void;
  }) {
    return (
      <>
        {memberships.map((membership) => {
          const badgeVariant = getMembershipBadgeVariant(
            membership.club.id,
            notifications
          );
          const isSelected = selectedMembershipId === membership.id;
          return (
            <div
              key={membership.id}
              className={`panel-list-item ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(membership.id!)}
            >
              <Avatar
                src={membership.club.logoUrl || undefined}
                name={membership.club.name}
                size="sm"
                className="rounded-sm"
              />
              {/* Content */}
              <div className="flex flex-col w-full">
                <div className="flex gap-sm items-center">
                  <div className="flex flex-1 grow gap-sm">
                    <p className="title-sm emphasized">
                      {membership.club.shortName}
                    </p>
                    {membership.isPreferredClub && (
                      <Icon
                        name="star"
                        className="text-tertiary fill-tertiary"
                      />
                    )}
                    {/* 🚨 NEW: Error/Warning Badge */}
                    {badgeVariant && (
                      <Icon
                        name={`${badgeVariant}`}
                        size="sm"
                        className={`text-${badgeVariant}`}
                      />
                    )}
                  </div>
                  {/* Manager Badge */}
                  {(membership.canManageClub ||
                    membership.canManageMembers) && (
                    <Badge
                      variant={RoleBadgeVariants[RoleType.ADMIN]}
                      label={RoleTypeLabels[RoleType.ADMIN]}
                      className="w-auto"
                    />
                  )}
                  <Icon name="chevronright" size="md" />
                </div>
                {/* Location */}
                <p className="label-sm text-on-surface-variant">
                  {membership.club.address?.city}
                </p>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // ========================================
  // MEMBERSHIP DETAILS COMPONENT
  // 🎯 KEY: This component is used in TWO places:
  //    1. Inside .panel-detail (desktop/tablet)
  //    2. Inside .sheet-body (mobile)
  // ========================================
  function MembershipDetails({ membership }: { membership: ClubMembership }) {
    // temporarily until subscriptions are implemented
    const subscriptions: Subscription[] = [];

    // Get critical notifications for this clubMembership (error/warning only)
    const clubNotifications = getMembershipNotificationInfo(
      membership.club.id,
      notifications
    );

    // Check if registration renewal period is open
    const isRegistrationOpen = isWithinDateRange(
      membership.type.registrationOpenDate,
      membership.type.registrationCloseDate
    );

    const registrationStatusBadge = isRegistrationOpen ? "info" : "default";
    const registrationStatusLabel = isRegistrationOpen ? "Open" : "Closed";
    const showRegister =
      isRegistrationOpen &&
      isPastDateCheck(
        membership.registrationEndDate,
        membership.type.registrationCloseDate
      );

    // Permission check to enable Edit Membership button
    const canEdit = membership.canManageClub || membership.canManageMembers;

    return (
      <div className="container p-0 gap-sm lg:p-sm lg:bg-surface-container-lowest flex-1 grow justify-between">
        <div className="flex flex-col gap-sm">
          {/* Club Header + Set Preferred */}
          <div className="flex items-center justify-between gap-md pb-sm border-b border-outline-variant">
            <div className="flex items-center gap-sm">
              <Avatar
                src={membership.club.logoUrl || undefined}
                name={membership.club.name}
                size="xs"
                className="rounded-sm"
              />
              <span className="body-sm emphasized">
                {membership.club.shortName}
              </span>
              {membership.isPreferredClub && (
                <Icon
                  name="star"
                  className="text-tertiary fill-tertiary"
                  size="sm"
                />
              )}
            </div>
            {!membership.isPreferredClub && (
              <div className="flex items-center gap-sm">
                <span className="body-sm">Set Preferred:</span>
                <RadioButton
                  name="preferredClub"
                  value={membership.id?.toString()}
                  checked={membership.isPreferredClub}
                  onChange={() => handleSetPreferred(membership.id!)}
                  aria-label="Set as preferred club"
                />
              </div>
            )}
          </div>
          {/* Details */}
          <div className="flex flex-col gap-sm p-sm bg-surface-container-low rounded-md">
            {/* Critical Notifications (Error/Warning only) */}
            {clubNotifications &&
              clubNotifications.map((notification, index) => (
                <div key={index} className="flex items-center gap-sm p-0">
                  <Icon
                    name={`${notification.variant}`}
                    size="sm"
                    className={`text-${notification.variant}`}
                  />
                  <p className={`label-sm flex-1 text-${notification.variant}`}>
                    {notification.message}
                  </p>
                </div>
              ))}

            {/* Primary Details */}
            <div className="flex flex-col gap-sm pb-sm border-b border-outline-variant w-full">
              {/* Membership Number and Status */}
              <div className="flex lg:flex-row gap-sm justify-between">
                <div className="flex flex-1 grow items-center justify-start gap-sm">
                  <span className="body-sm emphasized">Membership Number:</span>
                  <span className="label-md">
                    {membership.membershipNumber}
                  </span>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-sm">
                  <span className="body-sm emphasized">Status:</span>
                  <MembershipStatusBadge status={membership.status} />
                </div>
              </div>
              {/* Membership Type and Expiry Date */}
              <div className="flex gap-sm justify-between">
                <div className="flex flex-1 grow items-center justify-start gap-sm">
                  <span className="body-sm emphasized">Membership Type:</span>
                  <span className="label-md">{membership.type.name}</span>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-sm">
                  <span className="body-sm emphasized">Expiry Date:</span>
                  <ExpiryDate
                    date={membership.registrationEndDate}
                    format="short"
                    nullText="Lifetime"
                    warningDays={30}
                    className="label-md emphasized"
                  />
                </div>
              </div>
            </div>
            {/* Registration Renewal and Action Button */}
            <div className="flex justify-between gap-sm pb-sm border-b border-outline-variant w-full">
              {/* Registration Renewal */}
              <div className="flex items-center gap-sm">
                <div className="flex items-center gap-xs shrink-0">
                  <span className="body-sm emphasized">
                    Registration Renewal:
                  </span>
                  <Badge
                    variant={registrationStatusBadge}
                    label={registrationStatusLabel}
                    className="w-fit"
                  />
                </div>
                <span className="label-md">
                  {formatDate(membership.type.registrationOpenDate)}
                  {" to "}
                  {formatDate(membership.type.registrationCloseDate)}
                </span>
              </div>

              {/* Action Button */}
              {showRegister && (
                <Button // need to figure out how to deal with Registration
                  variant="filled"
                  size="sm"
                  icon="register"
                  label="Register"
                  className="w-fit"
                />
              )}
            </div>
            {/* Roles */}
            <div className="flex items-center gap-sm pb-sm border-b border-outline-variant w-full">
              <span className="body-sm emphasized">Assigned Roles:</span>
              <div className="flex flex-wrap gap-xs">
                {membership.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant={RoleBadgeVariants[role.name]}
                    label={RoleTypeLabels[role.name]}
                    className="w-fit"
                  />
                ))}
              </div>
            </div>
            {/* Skill Levels */}
            <div className="flex gap-sm w-full">
              <span className="body-sm emphasized">Assessed Skill Level:</span>
              <div className="flex flex-wrap gap-xs">
                {membership.levels.map((level) => (
                  <Badge
                    key={level.id}
                    variant={SkillLevelBadgeVariant[level.level]}
                    label={SkillLevelLabels[level.level]}
                    className="w-auto"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="border-b border-outline-variant px-sm"></div>
          {/* Subscriptions */}
          <div className="flex flex-col gap-sm p-sm bg-surface-container-low rounded-md">
            <div className="flex items-center justify-between gap-md pb-sm border-b border-outline-variant">
              <span className="body-md emphasized">My Subscriptions</span>
              {subscriptions.length > 0 && (
                <Button
                  variant="highlighted"
                  size="sm"
                  href="/subscriptions" // The route will need to be modified!
                  label="View All"
                />
              )}
            </div>
            {subscriptions.length === 0 ? (
              <EmptyState
                icon="subscriptions"
                title="No available Subscriptions"
                description="You do not have purchased any subscriptions from this club!"
                className="text-on-surface bg-surface-container-lowest rounded-md"
              />
            ) : (
              <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-md border border-primary p-sm"
                  >
                    {/* Layout for Subscriptions in here */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex py-sm justify-between">
          <Button
            variant="filled"
            icon="show"
            label="View Club Details"
            href={`/club/${membership.club.id}`}
            size="sm"
          />
          {canEdit && (
            <Button
              variant="outlined"
              icon="edit"
              label="Edit Membership"
              href={`/admin/members/${membership.id}`}
              size="sm"
            />
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="container flex-col w-full h-full p-0">
      {/* =============== TITLE SECTION =============== */}
      <div className="flex w-full justify-between items-center border-b border-outline-variant pb-sm">
        <p className="title-md emphasized">My Memberships</p>
        <Button
          size="sm"
          variant="outlined"
          icon="add"
          href="/club/create"
          label="Create Club"
        />
      </div>

      {/* =============== PANEL SECTION =============== */}
      {/* Memberships Section */}
      <div className="panel">
        {/* 
                    LEFT SIDE: Memberships List 
                    - Always visible on all screen sizes
                */}
        <div className="panel-list">
          {hasMemberships ? (
            <MembershipsList
              selectedMembershipId={selectedMembershipId}
              onSelect={handleSelectMembership}
            />
          ) : (
            <EmptyState
              icon="memberships"
              title="No Memberships to show!"
              description="You do not have any memberships yet. Join or create a club!"
              className="text-on-surface bg-surface-container-lowest rounded-md"
              actionLabel="Join a Club"
              actionIcon="add"
              href="/club/list?intent=join"
            />
          )}
          <div className="flex justify-end pt-sm">
            <Button
              size="sm"
              variant="outlined"
              icon="add"
              href="/club/list?intent=join"
              label="Join another Club"
            />
          </div>
        </div>
        {/* 
                    RIGHT SIDE: Details Panel (DESKTOP/TABLET ONLY)
                    - CSS: hidden on mobile, md:flex on tablet+
                    - This is RENDER LOCATION #1 for MembershipDetails

                    1. Page loads
                        ├─ selectedMembershipId = null
                        ├─ selectedMembership = memberships[0] (auto-selected!)
                        ├─ Panel shows first membership ✅
                        └─ Sheet component exists but CSS hides it (md:hidden) ✅

                    2. User clicks membership #5
                        ├─ selectedMembershipId = 5
                        ├─ selectedMembership = memberships[5]
                        └─ Panel updates to show #5 ✅
                */}
        <div className="panel-detail">
          {selectedMembership && (
            <MembershipDetails membership={selectedMembership} />
          )}
        </div>
      </div>
      {/* 
                MOBILE ONLY: Sheet Overlay
                - Only renders when selectedMembership exists
                - md:hidden hides this entire section on tablet+
                - This is RENDER LOCATION #2 for MembershipDetails
            */}
      {/*  
                1. Page loads
                    ├─ selectedMembershipId = null
                    ├─ selectedMembership = memberships[0] (auto-selected!)
                    ├─ open={!!null} = false
                    └─ Sheet is CLOSED ✅

                2. User clicks membership #5
                    ├─ selectedMembershipId = 5
                    ├─ selectedMembership = memberships[5]
                    ├─ open={!!5} = true
                    └─ Sheet OPENS ✅

                3. User clicks backdrop or X
                    ├─ onOpenChange(false) → handleCloseMembership()
                    ├─ selectedMembershipId = null
                    ├─ selectedMembership = memberships[0] (auto-select again)
                    ├─ open={!!null} = false
                    └─ Sheet CLOSES ✅
            */}
      <div className="lg:hidden">
        <Sheet
          open={!!selectedMembershipId} // <- only this controls visibility
          onOpenChange={(open) => {
            if (!open) handleCloseMembership();
          }}
          title="Membership Details"
          mode="responsive-right"
        >
          {selectedMembership && (
            <MembershipDetails membership={selectedMembership} />
          )}
        </Sheet>
      </div>
    </div>
  );
}
