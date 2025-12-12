"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { Sidebar, type SidebarItem, type SidebarSection } from "@/ui";
import { DASHBOARD_NAV_ITEMS, DASHBOARD_ADMIN_ITEMS } from "@/data/navigation";
import { type MemberUser } from "@/lib/definitions";
import { ClubDropdown } from "./ClubDropdown";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, isMemberUser } = useAuth();

  // Resolve dashboard href based on membership
  // const resolvedDashboardHref = isMemberUser
  //  ? "/dashboard/member"
  //  : "/dashboard/public";

  // Get current membership (for now, use preferred club)
  // TODO: Replace with useDashboard() when DashboardContext is created
  const currentMembership = isMemberUser
    ? (user as MemberUser).clubMemberships?.find(m => m.isPreferredClub)
    : null;

  // Build base navigation items
  const baseItems: SidebarItem[] = DASHBOARD_NAV_ITEMS.map((item) => ({
    // Update the href for dashboard item
    // const href = item.href === "/dashboard" ? resolvedDashboardHref : item.href;
      icon: item.icon,
      label: item.label,
      href: item.href || '#',
      active: pathname === item.href, // ✅ Simple! Now it matches!
  }));

  // Build admin items conditionally based on permissions
  const adminItems: SidebarItem[] = [];
  
  if (currentMembership) {
    // Add "Manage Members" if user has permission
    if (currentMembership.canManageMembers) {
      const item = DASHBOARD_ADMIN_ITEMS.find(i => i.href === '/dashboard/admin-members');
      if (item) {
        adminItems.push({
          icon: item.icon,
          label: item.label,
          href: item.href || '#',
          active: pathname === item.href,
        });
      }
    }

    // Add "Court Schedule" if user has permission
    if (currentMembership.canManageCourts) {
      const item = DASHBOARD_ADMIN_ITEMS.find(i => i.href === '/dashboard/admin-courts');
      if (item) {
        adminItems.push({
          icon: item.icon,
          label: item.label,
          href: item.href || '#',
          active: pathname === item.href,
        });
      }
    }

    // Add "Training" if user has permission
    if (currentMembership.canCreateTraining) {
      const item = DASHBOARD_ADMIN_ITEMS.find(i => i.href === '/dashboard/admin-training');
      if (item) {
        adminItems.push({
          icon: item.icon,
          label: item.label,
          href: item.href || '#',
          active: pathname === item.href,
        });
      }
    }
  }

  // Build sections array
  const sections: SidebarSection[] = [
    { items: baseItems },
    // Only add admin section if there are admin items
    ...(adminItems.length > 0 ? [{ items: adminItems, separator: true }] : [])
  ];

  return (
    <Sidebar 
      sections={sections}
      header={<ClubDropdown />}
    />
  );
}
