"use client";

// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Created ProfileSidebar wrapper component
// Purpose: Manages profile navigation with setup flow logic
// Uses: ui Sidebar component + navigation.ts data
// ========================

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type SidebarItem, type SidebarSection } from "@/ui";
import { PROFILE_NAV_ITEMS } from "@/data/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { calculateBadge } from "@/lib/badgeUtils";

export function ProfileSidebar() {
  const pathname = usePathname();
  const { notifications } = useAuth();

  // Profile-specific logic: Disable all navigation during setup
  const isSetupPage = pathname === "/profile/setup";

  // Map navigation items and detect active state
  // Memoize items to prevent unnecessary re-renders
  const sections: SidebarSection[] = useMemo(() => {
    const baseItems: SidebarItem[] = PROFILE_NAV_ITEMS.map((item) => {
      // item.badgeCount is number
      const badge = notifications ? calculateBadge(item.badgeCount, notifications) : null;
      return {
        icon: item.icon,
        label: item.label,
        href: item.href || '#',
        active: pathname === item.href,
        disabled: isSetupPage,
        badgeCount: badge?.count,
        badgeVariant: badge?.variant,
      };
    });
    const sectionArray: SidebarSection[] = [{ items: baseItems }];
    return sectionArray;
  }, [pathname, isSetupPage, notifications]);

  return (
    <Sidebar 
      sections={sections} 
    />
  );
}
