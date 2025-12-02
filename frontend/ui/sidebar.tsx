// === MODIFICATION LOG ===
// Date: 2025-11-13 UTC
// Modified by: Assistant
// Changes: Created new reusable Sidebar component
// Purpose: Unified sidebar navigation for desktop and tablet layouts
// ========================

import { MenuItem } from "./menuItem";

export interface SidebarItem {
  icon: string;
  label: string;
  href?: string | undefined;
  active?: boolean;
  badgeCount?: number;
  showAlert?: boolean;
  disabled?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

export function Sidebar({ items, className = "" }: SidebarProps) {
  return (
    <aside className={`sidebar ${className}`}>
      <nav>
        {items.map((item) => (
          <MenuItem
            key={item.href}
            context="sidebar"
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={item.active}
            badgeCount={item.badgeCount}
            showAlert={item.showAlert}
            disabled={item.disabled}
          />
        ))}
      </nav>
    </aside>
  );
}
