"use client";

import { useDashboard } from "@/providers/DashboardProvider";
import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Icon, Avatar, SelectOption } from "@/ui";
import { RoleBadgeVariants, RoleTypeLabels } from "@/lib/constants";
import { ClubSwitcherModal } from "../ClubSwitcherModal";
import { DASHBOARD_NAV_ITEMS } from "@/data";

export function DashboardHeader() {
  const { selectedClubId, setSelectedClub, currentMembership, memberships } =
    useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Early return if no membership
  if (!currentMembership || !currentMembership.club) {
    return null;
  }

  // Scroll navigation left/right
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };
  const { club, roles, isPreferredClub } = currentMembership;

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

  // Handle club selection (desktop dropdown)
  const handleClubChange = (clubId: number) => {
    setSelectedClub(clubId);
  };

  const renderHeader = () => {
    return (
      <>
        {/* Club Logo */}
        <Avatar
          src={club.logoUrl || undefined}
          name={club.name}
          size="md"
          className="rounded-xs"
        />
        <div className="dashboard-header">
          {/* Club Name + Star */}
          <div className="flex items-center gap-2 flex-1">
            <h2 className="title-md text-on-surface-variant">{club.name}</h2>
            {isPreferredClub && (
              <Icon name="star" className="text-tertiary fill-tertiary" />
            )}
          </div>
          {/* Role Badges */}
          {roles && roles.length > 0 && (
            <div className="badge-list">
              {roles.map((role) => (
                <Badge
                  key={role.id || role.name}
                  variant={RoleBadgeVariants[role.name]}
                  label={RoleTypeLabels[role.name]}
                  className="w-auto label-sm"
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="page__header pl-0 pr-0">
      {/* DESKTOP VERSION (≥1024px) - Static Card (Dropdown is in Sidebar!) */}
      <div className="hidden lg:flex lg:w-full lg:gap-md">{renderHeader()}</div>

      <div className="flex flex-col w-full">
        {/*  Tappable Card only for Mobile/Tablet */}
        <div className="flex lg:hidden">
          {memberships.length > 1 ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="dropdown-button"
            >
              {renderHeader()}
              {/* Dropdown Chevron (visual affordance) */}
              <Icon
                name="chevrondown"
                size="xl"
                bordered
                className="text-on-surface-variant"
              />
            </button>
          ) : (
            <>{renderHeader()}</>
          )}
        </div>

        {/* MOBILE VERSION (<640px) - Icon Navigation */}
        <div className="tabs-list sm:hidden">
          {/* Left Scroll Arrow */}
          <button
            onClick={scrollLeft}
            className="tabs-arrow"
            aria-label="Scroll left"
          >
            <Icon name="chevronleft" />
          </button>

          {/* Scrollable Icon Container */}
          <div ref={scrollContainerRef} className="tabs-scroll-container">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href || "#"}
                  className={`tabs-item ${isActive ? "active" : ""}`}
                  aria-label={item.label}
                >
                  <Icon name={item.icon} />
                </Link>
              );
            })}
          </div>
          {/* Right Scroll Arrow */}
          <button
            onClick={scrollRight}
            className="tabs-arrow"
            aria-label="Scroll right"
          >
            <Icon name="chevronright" />
          </button>
        </div>
      </div>

      {/* Club Switcher Modal (Mobile/Tablet) */}
      <ClubSwitcherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
