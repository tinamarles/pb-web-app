// === MODIFICATION LOG ===
// Date: 2025-12-27 UTC
// Modified by: Assistant
// Changes: Refactored MenuItem to use discriminated union types based on context
// - NO duplicate props! (removed item AND icon pattern)
// - Type-safe: context='sidebar' REQUIRES item: SidebarItem
// - Type-safe: context='dropdown' gets dropdown-specific props (icon, label, variant, etc.)
// - Type-safe: context='moremenu' REQUIRES item: SidebarItem
// - Clean separation: Each context has its own prop structure
// Previous: Had both item?: SidebarItem AND icon?: string (duplicative!)
// Reason: User's brilliant OCD-friendly suggestion - discriminated unions FTW!
// ========================

import { Icon } from "./icon";
import { Badge } from "./badge";
import { ReactNode } from "react";
import Link from "next/link";
import type { SidebarItem } from "./types";

/**
 * MenuItem Props - Discriminated Union Based on Context
 *
 * 🎯 NO DUPLICATE PROPS! Each context has its own clean prop structure.
 * TypeScript enforces the correct props based on context.
 */

// ========================================
// PROP TYPES
// ========================================

/** Base props for MoreMenuItem component (NO context!) */
type MoreMenuItemComponentProps = {
  item: SidebarItem;
  iconBordered?: boolean;
  showTrailing?: boolean;
  trailingIcon?: string;
  className?: string;
  onClick?: () => void; // added so MoreMenuSheet can close when navigating
};

/** Props for MenuItem when  context='moremenu' (WITH context) */
type MoreMenuItemProps = {
  context: "moremenu";
} & MoreMenuItemComponentProps;

// Same pattern for Sidebar and Dropdown...
type SidebarMenuItemComponentProps = {
  item: SidebarItem;
  showTrailing?: boolean;
  trailingIcon?: string;
  className?: string;
};

type SidebarMenuItemProps = {
  context: "sidebar";
} & SidebarMenuItemComponentProps;

type DropdownMenuItemComponentProps = {
  icon?: string;
  iconBordered?: boolean;
  label?: string;
  variant?: "default" | "danger";
  onClick?: () => void;
  href?: string;
  separator?: boolean;
  disabled?: boolean;
  className?: string;
  trailingItem?: ReactNode;
};

type DropdownMenuItemProps = {
  context: "dropdown";
} & DropdownMenuItemComponentProps;

/** MenuItem Props - Discriminated Union */
export type MenuItemProps =
  | SidebarMenuItemProps
  | DropdownMenuItemProps
  | MoreMenuItemProps;
/**
 * MenuItem Component
 *
 * A unified, reusable menu item component that works in dropdowns, sidebars, and mobile more menus.
 * Uses the 'context' prop to determine appropriate styling and behavior.
 * 
 * **✅ DISCRIMINATED UNION PATTERN (2025-12-27):**
 * - context='sidebar' → REQUIRES `item: SidebarItem` (NO duplicate props!)
 * - context='moremenu' → REQUIRES `item: SidebarItem`
 * - context='dropdown' → Uses individual props (icon, label, variant, etc.)
 * 
 * Features:
 * - Works in dropdowns (context='dropdown'), sidebars (context='sidebar'), and more menus (context='moremenu')
 * - Supports both link and button modes
 * - Uses <Badge> component for badges and alerts (follows design system)
 * - Optional icons (leading and trailing)
 * - Active state styling (sidebar)
 * - Variant support for danger/destructive actions (dropdown)
 * - Uses CSS variables for all styling
 
 */
// ========================================
// MAIN COMPONENT
// ========================================
export function MenuItem(props: MenuItemProps) {
  if (props.context === "sidebar") {
    const { context, ...sidebarProps } = props;
    return <SidebarMenuItem {...sidebarProps} />;
  } else if (props.context === "moremenu") {
    const { context, ...moreMenuProps } = props;
    return <MoreMenuItem {...moreMenuProps} />;
  } else {
    const { context, ...dropdownProps } = props;
    return <DropdownMenuItem {...dropdownProps} />;
  }
}

// ========================================
// SIDEBAR MENU ITEM
// ========================================
function SidebarMenuItem({
  item,
  showTrailing,
  trailingIcon = "chevronright",
  className = "",
}: SidebarMenuItemComponentProps) {
  const content = (
    <>
      {/* Leading Icon with Badge/Alert positioned on it */}
      <div className="relative">
        <Icon name={item.icon} size="xl" bordered />

        {/* Badge (notification count) - positioned on icon */}
        {item.badgeCount !== undefined && item.badgeCount > 0 && (
          <Badge
            variant={item.badgeVariant ?? "default"}
            className="sidebar__badge"
          >
            {item.badgeCount}
          </Badge>
        )}
      </div>

      {/* Label */}
      <span className="label-lg">{item.label}</span>

      {/* Trailing Icon (chevron for sub-menu) */}
      {showTrailing && (
        <div className="sidebar__trailing">
          <Icon name={trailingIcon} className="icon-sm" />
        </div>
      )}
    </>
  );

  const itemClasses = `sidebar__item ${
    item.active ? "active" : ""
  } ${className}`;

  // ✅ Guard: Only render Link if href exists (TypeScript requirement)
  if (!item.href) {
    console.error("❌ SidebarMenuItem: href is required but missing!", item);
    return null;
  }

  return (
    <Link
      href={item.href}
      className={itemClasses}
      aria-disabled={item.disabled}
      onClick={(e) => {
        console.log("🖱️ MENUITEM CLICK:", {
          href: item.href,
          label: item.label,
          context: "sidebar",
        });
      }}
    >
      {content}
    </Link>
  );
}

// ========================================
// MORE MENU ITEM
// ========================================
function MoreMenuItem({
  item,
  iconBordered = true,
  showTrailing,
  trailingIcon = "chevronright",
  className = "",
  onClick
}: MoreMenuItemComponentProps) {
  const content = (
    <>
      {/* Leading Icon with Badge/Alert positioned on it */}
      <div className="relative">
        <Icon name={item.icon} size="sm" bordered={iconBordered} />

        {/* Badge (notification count) - positioned on icon */}
        {/* ✅ FIXED (2025-12-29): Now receives concrete badgeCount (number) from MorePage LAYER 2 transform */}
        {item.badgeCount !== undefined && item.badgeCount > 0 && (
          <Badge variant={item.badgeVariant ?? 'default'} className="more-menu__badge">
            {item.badgeCount}
          </Badge>
        )}
      </div>

      {/* Label */}
      <span className="more-menu__item-label">{item.label}</span>

      {/* Trailing Icon (chevron for sub-menu) */}
      {showTrailing && (
        <div className="more-menu__item-trailing">
          <Icon name={trailingIcon} className="icon-sm" />
        </div>
      )}
    </>
  );

  const itemClasses = `more-menu__item ${className}`;

  // ✅ Guard: Only render Link if href exists (TypeScript requirement)
  if (!item.href) {
    console.error("❌ MoreMenuItem: href is required but missing!", item);
    return null;
  }

  return (
    <Link
      href={item.href}
      className={itemClasses}
      aria-disabled={item.disabled}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}

// ========================================
// DROPDOWN MENU ITEM
// ========================================
function DropdownMenuItem({
  icon,
  iconBordered = true,
  label,
  variant = "default",
  onClick,
  href,
  separator = false,
  disabled = false,
  className = "",
  trailingItem,
}: DropdownMenuItemComponentProps) {
  const content = (
    <>
      {icon && (
        <div className="relative">
          <Icon name={icon} size="lg" bordered={iconBordered} />
        </div>
      )}

      <span className="menu-item-label">{label}</span>

      {trailingItem && <div className="menu-item-trailing">{trailingItem}</div>}
    </>
  );

  const itemClasses = ["menu-item", `menu-item-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  const itemContent = href ? (
    <Link
      href={href}
      className={itemClasses}
      aria-disabled={disabled}
      onClick={(e) => {
        console.log("🖱️ MENUITEM CLICK:", { href, label, context: "dropdown" });
      }}
    >
      {content}
    </Link>
  ) : (
    <button
      onClick={onClick}
      disabled={disabled}
      className={itemClasses}
      type="button"
    >
      {content}
    </button>
  );

  return (
    <div
      className={
        separator
          ? "menu-item-wrapper menu-item-separator"
          : "menu-item-wrapper"
      }
    >
      {itemContent}
    </div>
  );
}
