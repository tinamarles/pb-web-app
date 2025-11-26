"use client";

// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Created ProfileSidebar wrapper component
// Purpose: Manages profile navigation with setup flow logic
// Uses: ui-brand Sidebar component + navigation.ts data
// ========================

import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/AuthUserProvider";
import { Sidebar, type SidebarItem } from "@/app/ui";
import { DASHBOARD_NAV_ITEMS } from "@/app/data/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isMemberUser } = useAuth();

  // Resolve dashboard href based on membership
  const resolvedDashboardHref = isMemberUser
    ? "/dashboard/member"
    : "/dashboard/public";

  const items: SidebarItem[] = DASHBOARD_NAV_ITEMS.map((item) => {
    // Update the href for dashboard item
    const href = item.href === "/dashboard" ? resolvedDashboardHref : item.href;
    return {
      icon: item.icon,
      label: item.label,
      href: href,
      active: pathname === href, // ✅ Simple! Now it matches!
    };
  });

  return <Sidebar items={items} />;
}
