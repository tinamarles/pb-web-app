"use client";

// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Created ProfileSidebar wrapper component
// Purpose: Manages profile navigation with setup flow logic
// Uses: ui-brand Sidebar component + navigation.ts data
// ========================

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type SidebarItem } from "@/ui";
import { PROFILE_NAV_ITEMS } from "@/data/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { getWorstBadgeVariantForNotifications } from "@/lib/constants";
import type { NotificationTypeValue } from "@/lib/constants";

export function ProfileSidebar() {
  const pathname = usePathname();
  const { notifications } = useAuth();

  // Profile-specific logic: Disable all navigation during setup
  const isSetupPage = pathname === "/profile/setup";

  // ✅ GENERIC helper - counts unread notifications for given type(s)
  // NO HARD-CODING! Just compares navItem.badgeCount to notification.type
  // NO CLUB FILTERING: Profile notifications are user-level (no clubId)
  const getUnreadCount = (badgeCount?: NotificationTypeValue | NotificationTypeValue[]): number => {
    if (!badgeCount) return 0;
    
    const types = Array.isArray(badgeCount) ? badgeCount : [badgeCount];
    
    return notifications.filter(
      n => types.includes(n.notificationType) && !n.isRead
    ).length;
  };

  // Map navigation items and detect active state
  // Memoize items to prevent unnecessary re-renders
  const items: SidebarItem[] = useMemo(() => {
    return PROFILE_NAV_ITEMS.map(item => ({
      icon: item.icon,
      label: item.label,
      href: item.href || '#',
      active: pathname === item.href,
      disabled: isSetupPage,
      badgeCount: getUnreadCount(item.badgeCount),  // ✅ Count!
      badgeVariant: getWorstBadgeVariantForNotifications(notifications, item.badgeCount),  // ✅ Color!
    }));
  }, [pathname, isSetupPage, notifications]);

  return <Sidebar items={items} />;
}
