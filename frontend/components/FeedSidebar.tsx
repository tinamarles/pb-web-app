"use client";

// === MODIFICATION LOG ===
// Date: 2025-11-17 UTC
// Modified by: Assistant
// Changes: Created ProfileSidebar wrapper component
// Purpose: Manages profile navigation with setup flow logic
// Uses: ui-brand Sidebar component + navigation.ts data
// ========================

import { usePathname } from "next/navigation";
import { Sidebar, type SidebarItem } from "@/ui";
import { FEED_NAV_ITEMS } from "@/data/navigation";

export function FeedSidebar() {
  const pathname = usePathname();

  const items: SidebarItem[] = FEED_NAV_ITEMS.map((item) => {
    // Update the href for dashboard item
    
    return {
      icon: item.icon,
      label: item.label,
      href: item.href,
      active: pathname === item.href, // ✅ Simple! Now it matches!
    };
  });

  return <Sidebar items={items} />;
}
