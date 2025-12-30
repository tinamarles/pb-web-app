"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Icon, Avatar, Button, MenuItem } from "@/ui";
import { useAuth } from "@/providers/AuthUserProvider";
// import { Module } from "@/shared";
import { ModuleClientOnly as Module } from "@/shared";
import { MORE_MENU_SECTIONS, MORE_MENU_FOOTER_LINKS } from "@/data";
import { calculateBadge } from "@/lib/badgeUtils";
import { SidebarItem } from "@/ui";

/**
 * MorePage - Mobile menu page for authenticated users
 *
 * This is a regular page (not an overlay) that shows:
 * - User profile card with "View Profile" link
 * - Sign Out button
 * - Settings section (Account, Privacy, Notifications, Appearance, Home Screen)
 * - Features section (Club Memberships, Performance, Community, Personal Blog)
 * - Resources section (Courts, Coaches, Drill Library, Useful Links)
 * - Learn section (Explore Our Features)
 * - Footer links (About, Contact, Privacy, Terms)
 *
 * Title is managed by apiResponseModule (type: "moremenu")
 * Navigation data comes from /data/navigation.ts
 * Styling uses CSS classes from /styles/globals.css (NO inline styles!)
 *
 * THREE LAYER ARCHITECTURE:
 * - LAYER 1 (Definition): NavItem[] from navigation.ts (semantic - NotificationTypeValue)
 * - LAYER 2 (Transform): This component transforms to SidebarItem[] (concrete - number + BadgeVariant)
 * - LAYER 3 (Display): MenuItem receives SidebarItem and just renders (DUMB)
 *
 * USAGE:
 * Route: /more
 * Accessed from BottomNav "More" button
 */

export const MoreMenuPage = memo(function MoreMenuPage() {
  const { user, logout, notifications } = useAuth();

  // ✅ LAYER 2: Transform NavSection[] → sections with SidebarItem[]
  // Memoize to prevent unnecessary recalculations
  // IMPORTANT: useMemo MUST be called before any early returns (Rules of Hooks!)
  const transformedSections = useMemo(() => {
    return MORE_MENU_SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        // Calculate badge using unified logic
        const badge = calculateBadge(item.badgeCount, notifications);

        // Transform NavItem → SidebarItem (concrete props)
        return {
          icon: item.icon,
          label: item.label,
          href: item.href,
          badgeCount: badge?.count, // ✅ number (concrete)
          badgeVariant: badge?.variant, // ✅ BadgeVariant (concrete)
          disabled: item.disabled,
        } as SidebarItem;
      }),
    }));
  }, [notifications]); // Recalculate when notifications change

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
  };

  // Early return AFTER all hooks (Rules of Hooks!)
  if (!user) return null;

  return (
    <Module type="more">
      <div className="min-h-full pb-24">
        {/* Top Section Container - Profile Card + Sign Out */}
        <div className="more-menu__top-section">
          {/* Profile Card - Centered with flex container */}
          <Link href="/profile/details" className="more-menu__profile-card">
            <Avatar
              size="lg"
              src={user.profilePictureUrl || undefined}
              name={
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
              }
              className="avatar-container"
            />
            <div className="flex-1">
              <p className="title-md emphasized">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </p>
              <p className="body-sm text-primary">View Profile</p>
            </div>
            <Icon
              name="chevronright"
              className="icon-md text-on-surface-variant"
            />
          </Link>

          {/* Sign Out Button - Centered */}
          <Button
            onClick={handleSignOut}
            variant="subtle"
            icon="signout"
            label="Sign Out"
            size="lg"
          ></Button>
        </div>

        {/* Menu Sections - Single map! */}
        {/* ✅ LAYER 3: Pass SidebarItem[] to MenuItem (concrete props) */}
        {transformedSections.map((section) => (
          <div key={section.id} className="more-menu__section">
            <div className="more-menu__section-header">
              <div className="more-menu__section-header-inner">
                <h2 className="more-menu__section-title">{section.title}</h2>
              </div>
            </div>
            <div className="more-menu__section-content">
              {section.items.map((item) => (
                <MenuItem
                  key={item.href || item.label}
                  context="moremenu"
                  item={item}
                  showTrailing
                  trailingIcon="chevronright"
                />
              ))}
            </div>
          </div>
        ))}

        {/* Separator before footer */}
        <div className="border-t border-outline-variant"></div>

        {/* Footer Links */}
        <div className="more-menu__footer-links mb-lg">
          {MORE_MENU_FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="more-menu__footer-link"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </Module>
  );
});

export default MoreMenuPage;
