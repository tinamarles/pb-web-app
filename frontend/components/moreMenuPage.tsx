"use client";

// === MODIFICATION LOG ===
// Date: 2025-11-19 UTC
// Modified by: Assistant
// Changes: Major refactor - use navigation.ts data and CSS classes instead of inline styles
// Previous: Hardcoded section arrays, inline styles everywhere, repetitive mapping code
// New: Import from navigation.ts, use CSS classes from globals.css, single sections.map()
// Impact: DRY principle, CSS-driven design, single source of truth, no inline styles
// Backup: /backups/MorePage-backup-2025-11-19.md
// ========================

import { memo } from "react";
import Link from "next/link";
import { Icon, Avatar, Button, MenuItem } from "@/ui";
import { useAuth } from "@/providers/AuthUserProvider";
import { Module } from "@/shared";
import { MORE_MENU_SECTIONS, MORE_MENU_FOOTER_LINKS } from "@/data";

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
 * USAGE:
 * Route: /more
 * Accessed from BottomNav "More" button
 */
export const MoreMenuPage = memo(function MoreMenuPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
  };

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
        {MORE_MENU_SECTIONS.map((section) => (
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
                  item={item} // ✅ Pass the whole item object!
                  context="moremenu"
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
