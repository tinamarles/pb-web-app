"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { useDashboard } from "@/providers/DashboardProvider";
import { Sidebar, type SidebarItem, type SidebarSection } from "@/ui";
import { DASHBOARD_NAV_ITEMS, DASHBOARD_ADMIN_ITEMS } from "@/data/navigation";
import { ClubDropdown } from "../ClubDropdown";
import { calculateBadge } from "@/lib/badgeUtils";
import { Announcement, Notification } from "@/lib/definitions";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { notifications } = useAuth();
  const { currentMembership } = useDashboard();

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

    const baseItems: SidebarItem[] = DASHBOARD_NAV_ITEMS.map((item) => {
      
      const badge = clubFilteredNotifications ? calculateBadge(item.badgeCount, clubFilteredNotifications) : null;
      return {
      label: item.label,
      icon: item.icon,
      href: item.href || "#",
      active: pathname === item.href,
      badgeCount: badge?.count, // ✅ Club-filtered count!
      badgeVariant: badge?.variant, // ✅ colour
      }; 
    });

    const adminItems: typeof baseItems = [];

    // ✅ Add "Admin Dashboard" if user has ANY admin permissions
    if (currentMembership && hasAnyAdminPermission(currentMembership)) {
      const item = DASHBOARD_ADMIN_ITEMS.find(
        (i) => i.href === "/admin/[clubId]/events/list"
      ); // ← ONE admin item!
      if (item) {
        const badge = calculateBadge(item.badgeCount, clubFilteredNotifications);
        adminItems.push({
          icon: item.icon,
          label: item.label,
          href: item.href?.replace("[clubId]", String(currentMembership?.club.id)) || "#",
          active: pathname === item.href?.replace("[clubId]", String(currentMembership?.club.id)) ,
          badgeCount: badge?.count,
          badgeVariant: badge?.variant,
        });
      }
    }

    // Build sections array
    const sectionArray: SidebarSection[] = [
      { items: baseItems },
      // Only add admin section if there are admin items
      ...(adminItems.length > 0
        ? [{ items: adminItems, separator: true }]
        : []), // ← SEPARATOR!
    ];

    return sectionArray;
  }, [pathname, currentMembership, clubFilteredNotifications]); // ✅ Re-compute when club/notifications change!

  return (
    <Sidebar
      header={<ClubDropdown />} // ✅ ClubDropdown header (handles its own responsive logic)
      sections={sections}
    />
  );
}
