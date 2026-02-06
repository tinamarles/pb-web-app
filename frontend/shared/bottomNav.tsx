"use client";

import {
  Icon,
  Avatar,
  MenuItem,
  Dropdown,
} from "@/ui";
import { MoreMenuSheet } from "@/components/moreMenuSheet";
import Link from "next/link";
import { useAuth } from "@/providers/AuthUserProvider";
import { useState } from "react";

export interface BottomNavItem {
  type: "link" | "fab" | "more";
  id: string;
  icon: string;
  label: string;
  href?: string; // For 'link' type
  onClick?: () => void; // For 'fab' and 'more' types
  badge?: number; // Optional notification badge
  active?: boolean; // Is this item currently active?
}

export interface BottomNavProps {
  items?: BottomNavItem[];
  className?: string;
}

/**
 * BottomNav - Mobile bottom navigation bar component
 *
 * This component creates an app-like bottom navigation bar with:
 * - Up to 5 navigation items
 * - Center FAB (Floating Action Button) support
 * - Active state indicators
 * - Notification badges
 *
 * USAGE:
 * <BottomNav items={[
 *   { type: 'link', id: 'dashboard', icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
 *   { type: 'fab', id: 'quick', icon: 'chevronup', label: 'Quick', onClick: handleFAB },
 *   { type: 'more', id: 'more', icon: 'menu', label: 'More', onClick: handleMore },
 * ]} />
 */
export function BottomNav({ items = [], className = "" }: BottomNavProps) {
  const { user } = useAuth();

  // State for MoreMenuSheet
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Quick Actions menu items (same as header dropdown)
  const quickActionsItems = [
    { icon: "calendar", label: "View Your Schedule", href: "/event/my-activities" },
    { icon: "book-court", label: "Book a Court", href: "/book_court" },
    { icon: "matches", label: "Record a Result", href: "/add_result" },
    { icon: "send", label: "Contact a Member", href: "/contact_member" },
  ];

  // RENDER INDIVIDUAL NAV ITEM
  const renderNavItem = (item: BottomNavItem) => {
    const isFAB = item.type === "fab";
    const isMore = item.type === "more";
    // ✅ Active state: For "more", active when sheet is open (not pathname!)
    const isActive = isMore ? isMoreSheetOpen : item.active;
    const baseClasses = `bottom-nav__item ${item.active ? "active" : ""}`;
    const fabClasses = isFAB ? "bottom-nav__item--fab" : "";

    // For FAB: Render with Dropdown component
    if (isFAB) {
      return (
        <Dropdown
          key={item.id}
          position="top"
          align="center"
          hoverEnabled={false}
          trigger={(isOpen: boolean) => (
            <button
              className={`${baseClasses} ${fabClasses}`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon
                  name={isOpen ? "close" : "chevronup"}
                  className="icon-2xl"
                />
              </div>
            </button>
          )}
        >
          {quickActionsItems.map((action) => (
            <MenuItem
              key={action.href}
              icon={action.icon}
              iconBordered={true}
              label={action.label}
              href={action.href}
              context="dropdown"
            />
          ))}
        </Dropdown>
      );
    }

    // Build the content (icon/avatar + label)
    const content = (
      <>
        {/* Icon/Avatar with optional badge */}
        <div className="relative">
          {isMore && user ? (
            // Show user avatar for "More" button
            <Avatar
              size="xs"
              src={user.profilePictureUrl || undefined}
              name={
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
              }
              className="avatar-container"
            />
          ) : (
            // For FAB: show dynamic icon based on menu state
            <Icon name={item.icon} className="icon-xl" />
          )}
          {/* Badge */}
          {item.badge && item.badge > 0 && (
            <span className="bottom-nav__badge">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </div>

        {/* Label */}
        <span className="bottom-nav__label">{item.label}</span>
      </>
    );

    // ✅ For 'more' type: Render as button that triggers sheet
    if (isMore) {
      return (
        <button
          key={item.id}
          className={`${baseClasses} ${fabClasses}`}
          onClick={() => setIsMoreSheetOpen(true)}
          aria-label={item.label}
        >
          {content}
        </button>
      );
    }

    // For 'link' or 'more' with href: Render as Link
    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={`${baseClasses} ${fabClasses}`}
        >
          {content}
        </Link>
      );
    }

    // For FAB or items with onClick: Render as button
    return (
      <button
        key={item.id}
        className={`${baseClasses} ${fabClasses}`}
        onClick={item.onClick}
        aria-label={item.label}
      >
        {content}
      </button>
    );
  };

  return (
    <nav className={`bottom-nav ${className}`}>
      {items.map((item) => renderNavItem(item))}
      {/* MoreMenuSheet */}
      <MoreMenuSheet isOpen={isMoreSheetOpen} onClose={() => setIsMoreSheetOpen(false)} />
    </nav>
  );
}
