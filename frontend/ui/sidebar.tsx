// === MODIFICATION LOG ===
// Date: 2025-11-13 UTC
// Modified by: Assistant
// Changes: Created new reusable Sidebar component
// Purpose: Unified sidebar navigation for desktop and tablet layouts
// ========================

import { MenuItem } from "./menuItem";
import { ReactNode } from "react";
import type { SidebarItem, SidebarSection } from "./types";

export interface SidebarProps {
  items?: SidebarItem[]; // Deprecated: use sections instead
  sections?: SidebarSection[];
  header?: ReactNode; // Optional header content (e.g., club dropdown)
  className?: string;
}

export function Sidebar({ items, sections, header, className = "" }: SidebarProps) {
  // Support legacy items prop by converting to single section
  const finalSections: SidebarSection[] = sections || (items ? [{ items }] : []);
  
  return (
    <aside className={`sidebar ${className}`}>
      {/* Optional header (e.g., club dropdown) */}
      {header && (
        // <div className="px-4 pb-4">
        <div className="sidebar__header">
          {header}
        </div>
      )}
      {/* Navigation sections */}
      <nav>
        {finalSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Separator before section (except first section) */}
            {section.separator && sectionIndex > 0 && (
              <div className="border-t border-outline-variant my-2 mx-4" />
            )}
            
            {/* Section items */}
            {section.items.map((item) => (
              <MenuItem
                key={item.href}
                context="sidebar"
                item={item}
              />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
