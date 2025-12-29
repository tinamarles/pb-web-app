"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { useDashboard } from "@/providers/DashboardProvider";
import { Sidebar, type SidebarItem, type SidebarSection } from "@/ui";
import { ADMIN_NAV_ITEMS } from "@/data/navigation";
import { ClubDropdown } from "../ClubDropdown";
import { getWorstBadgeVariantForNotifications } from "@/lib/constants";
import { NotificationTypeValue } from "@/lib/constants";

export function AdminSidebar() {
  const pathname = usePathname();
  const { notifications } = useAuth();
  const { currentMembership } = useDashboard();

  // ✅ Check if user has ANY admin permissions (any can* flag = true)
  // This is elegant because it automatically includes ALL current and future permissions!
  // The actual permission gating happens in AdminSidebar - this just shows the nav item
  const hasAnyAdminPermission = (
    membership: typeof currentMembership
  ): boolean => {
    if (!membership) return false;

    // Check if ANY property starting with 'can' is true
    return Object.entries(membership).some(
      ([key, value]) => key.startsWith("can") && value === true
    );
  };

  // ✅ GENERIC helper with CLUB FILTERING - counts unread notifications for given type(s)
  // NO HARD-CODING! Just compares navItem.badgeCount to notification.notificationType
  // CLUB-AWARE: Filters by currentMembership.clubId for club-specific notifications
  const getUnreadCount = (
    badgeCount?: NotificationTypeValue | NotificationTypeValue[]
  ): number => {
    if (!badgeCount) return 0;

    const types = Array.isArray(badgeCount) ? badgeCount : [badgeCount];

    return notifications.filter((n) => {
      // Basic checks: type match + unread
      if (!types.includes(n.notificationType) || n.isRead) return false;

      // Smart filtering: club-specific vs user-level notifications
      // If notification has clubId, it's club-specific → filter by current club
      // If notification has NO clubId, it's user-level → show for all clubs
      if (n.club?.id) {
        return n.club.id === currentMembership?.club.id; // ✅ Filter by current club!
      }

      // User-level notification (no clubId) - show regardless of current club
      return true;
    }).length;
  };

  // Memoize sections to prevent unnecessary re-renders
  const sections: SidebarSection[] = useMemo(() => {
    const baseItems: SidebarItem[] = ADMIN_NAV_ITEMS.map((item) => ({
      label: item.label,
      icon: item.icon,
      href: item.href || "#",
      active: pathname === item.href,
      badgeCount: getUnreadCount(item.badgeCount), // ✅ Club-filtered count!
      badgeVariant: getWorstBadgeVariantForNotifications(
        notifications,
        item.badgeCount
      ), // ✅ Color!
    }));

    // Build sections array
    const sectionArray: SidebarSection[] = [
      { items: baseItems },
    ];

    return sectionArray;
  }, [pathname, currentMembership, notifications]); // ✅ Re-compute when club/notifications change!

  return (
    <Sidebar
      header={<ClubDropdown context="admin" />} // ✅ ClubDropdown header (handles its own responsive logic)
      sections={sections}
    />
  );
}
