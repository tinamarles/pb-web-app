"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { useDashboard } from "@/providers/DashboardProvider";
import { Sidebar, type SidebarItem, type SidebarSection } from "@/ui";
import { ADMIN_NAV_ITEMS } from "@/data/navigation";
import { ClubDropdown } from "../ClubDropdown";
import { RoleTypeValue, getWorstBadgeVariantForNotifications } from "@/lib/constants";
import { NotificationTypeValue } from "@/lib/constants";
import { Announcement, Notification } from "@/lib/definitions";
import { calculateBadge } from "@/lib/badgeUtils";

export function AdminSidebar() {
  const pathname = usePathname();
  const { notifications } = useAuth();
  const { currentMembership } = useDashboard();

    // ✅ TODO: Permission logic for Admin Sidebar Items
  /**
   *                             Role
   *                     ADMIN  ORGANIZER  CAPTAIN  INSTRUCTOR
   * Reports               ✅      ✅         ✅         ✅
   * Calendar              ✅      ✅         ✅         ✅
   * Events                ✅      ✅         ✅         ✅
   * Memberships           ✅      ✅         ❌         ❌
   * Members               ✅      ✅         ❌         ❌
   * Announcements         ✅      ✅         ❌         ❌
   * Settings              ✅      ❌         ❌         ❌
   */
  
  /**
   * Check if user has permission to access a navigation item
   * 
   * @param item - Navigation item with optional permissions
   * @param membership - Current club membership with roles array
   * @returns true if user has any of the required roles, false otherwise
   * 
   * @example
   * // Item requires ADMIN only
   * hasPermission({ permissions: RoleType.ADMIN }, membership) 
   * 
   * @example
   * // Item requires ADMIN or ORGANIZER
   * hasPermission({ permissions: [RoleType.ADMIN, RoleType.ORGANIZER] }, membership)
   * 
   * @example
   * // Item has no permissions specified (accessible to all)
   * hasPermission({ permissions: undefined }, membership) // returns true
   */
  const hasPermission = (
    item: { permissions?: RoleTypeValue | RoleTypeValue[] },
    membership: typeof currentMembership,
  ): boolean => {
    // No membership → no access
    if (!membership) return false;

    // No permissions specified → accessible to all (default true)
    if (!item.permissions) return true;

    // Convert single permission to array for consistent processing
    const requiredPermissions = Array.isArray(item.permissions) 
      ? item.permissions 
      : [item.permissions];

    // Check if user has ANY of the required roles
    // ✅ DRY: Single source of truth - navigation.ts defines permissions once!
    return membership.roles.some(role => 
      requiredPermissions.includes(role.name)
    );
  };

  const hasAnyAdminPermission = (
    membership: typeof currentMembership,
  ): boolean => {
    if (!membership) return false;

    // Check if ANY property starting with 'can' is true
    return Object.entries(membership).some(
      ([key, value]) => key.startsWith("can") && value === true,
    );
  };
  
  // ✅ Pre-filter notifications by club (Dashboard-specific logic)
  // Smart filtering: club-specific vs user-level notifications
  const clubFilteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // If notification has club.id, it's club-specific → filter by current club
      if (n.club?.id) {
        return n.club.id === currentMembership?.club.id;
      }
      // User-level notification (no club) - show regardless of current club
      return true;
    });
  }, [notifications, currentMembership]);

  // Memoize sections to prevent unnecessary re-renders
  const sections: SidebarSection[] = useMemo(() => {
    const baseItems: SidebarItem[] = ADMIN_NAV_ITEMS.map((item) => {
      const badge = clubFilteredNotifications ? calculateBadge(item.badgeCount, clubFilteredNotifications) : null;
      // ✅ Check permission for this item based on user's roles
      const userHasPermission = hasPermission(item, currentMembership);
      
      return {
        label: item.label,
        icon: item.icon,
        href:
          item.href?.replace("[clubId]", String(currentMembership?.club.id)) ||
          "#",
        active:
          pathname ===
          item.href?.replace("[clubId]", String(currentMembership?.club.id)), // ✅ Active state based on pathname
        badgeCount: badge?.count, // ✅ Club-filtered count!
        badgeVariant: badge?.variant, // ✅ Color!
        disabled: !userHasPermission, // ✅ Disable if user lacks required role!
      };
    });

    // Build sections array
    const sectionArray: SidebarSection[] = [{ items: baseItems }];

    return sectionArray;
  }, [pathname, currentMembership, notifications]); // ✅ Re-compute when club/notifications change!

  return (
    <Sidebar
      header={<ClubDropdown context="admin" />} // ✅ ClubDropdown header (handles its own responsive logic)
      sections={sections}
    />
  );
}
