"use client";

// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Created ProfileSidebar wrapper component
// Purpose: Manages profile navigation with setup flow logic
// Uses: ui-brand Sidebar component + navigation.ts data
// ========================

import { usePathname } from "next/navigation";
import { Sidebar, type SidebarItem } from "@/app/ui";
import { DASHBOARD_NAV_ITEMS } from "@/app/data/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();

  // Map navigation items and detect active state
  const items: SidebarItem[] = DASHBOARD_NAV_ITEMS.map((item) => ({
    icon: item.icon,
    label: item.label,
    href: item.href,
    active: pathname === item.href,
    disabled: false,
    // TODO: Add disabled support to ui-brand/sidebar.tsx
    // For now, setup page redirect logic is handled by middleware
  }));

  return <Sidebar items={items} />;
}
